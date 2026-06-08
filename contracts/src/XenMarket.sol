// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title XenMarket
/// @notice Pari-mutuel range prediction market settled in USDC on Arc.
///
/// State machine:
///   OPEN → (deadline passes) → LOCKED → (resolver calls resolve/void) → RESOLVED | VOIDED
///   OPEN → CANCELLED  (only factory during emergency)
///
/// Range semantics:
///   - [min, max)  for all ranges except the last
///   - [min, ∞)    for the last range (maxOpen = true, max = 0)
///   - Ranges must be sorted ascending with no gaps/overlaps
///   - first range min >= startValue
contract XenMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Enums ────────────────────────────────────────────────────────────────

    enum MarketState { OPEN, LOCKED, RESOLVED, VOIDED, CANCELLED }
    enum MetricType  { FINAL_VIEWS, FINAL_LIKES, FINAL_REPOSTS, FINAL_REPLIES }

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Range {
        uint256 min;
        uint256 max;      // 0 if maxOpen
        bool    maxOpen;  // true only for the last range
        string  label;
        uint8   difficulty; // 1-10
    }

    // ─── State ────────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    address public immutable factory;
    address public immutable creator;
    address public immutable resolver;

    string  public tweetId;
    bytes32 public xUserIdHash;
    MetricType public metricType;
    uint256 public startValue;
    uint256 public marketEndTime;
    uint256 public marketStartTime;
    uint16  public protocolFeeBps;

    MarketState public state;
    uint256 public finalValue;
    uint8   public winningRangeIndex;
    bytes32 public evidenceHash;

    Range[] private _ranges;

    // rangeIndex → total USDC staked in that range
    mapping(uint8 => uint256) public rangePool;
    // user → rangeIndex → amount staked
    mapping(address => mapping(uint8 => uint256)) public userStake;

    uint256 public totalPool;
    bool    private _resolved;

    // ─── Events ───────────────────────────────────────────────────────────────

    event BetPlaced(address indexed user, uint8 indexed rangeIndex, uint256 amount);
    event MarketResolved(uint8 indexed winningRangeIndex, uint256 finalValue, bytes32 evidenceHash);
    event MarketVoided(bytes32 reasonHash);
    event MarketCancelled();
    event Claimed(address indexed user, uint256 payout);
    event Refunded(address indexed user, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyResolver() {
        require(msg.sender == resolver, "XenMarket: not resolver");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "XenMarket: not factory");
        _;
    }

    modifier onlyOpen() {
        require(state == MarketState.OPEN, "XenMarket: not open");
        _;
    }

    modifier onlyAfterDeadline() {
        require(block.timestamp >= marketEndTime, "XenMarket: market not expired");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _factory,
        address _creator,
        address _resolver,
        string  memory _tweetId,
        bytes32 _xUserIdHash,
        uint8   _metricType,
        uint256 _startValue,
        uint256 _marketStartTime,
        uint256 _marketEndTime,
        Range[] memory ranges,
        uint16  _protocolFeeBps
    ) {
        require(_marketEndTime > _marketStartTime, "XenMarket: invalid times");
        require(_marketEndTime > block.timestamp, "XenMarket: end in past");
        require(ranges.length >= 4 && ranges.length <= 6, "XenMarket: 4-6 ranges required");
        require(_metricType <= 3, "XenMarket: invalid metric");

        usdc             = IERC20(_usdc);
        factory          = _factory;
        creator          = _creator;
        resolver         = _resolver;
        tweetId          = _tweetId;
        xUserIdHash      = _xUserIdHash;
        metricType       = MetricType(_metricType);
        startValue       = _startValue;
        marketStartTime  = _marketStartTime;
        marketEndTime    = _marketEndTime;
        protocolFeeBps   = _protocolFeeBps;
        state            = MarketState.OPEN;

        _validateAndStoreRanges(ranges, _startValue);
    }

    // ─── Betting ──────────────────────────────────────────────────────────────

    /// @notice Stake USDC into a range. Caller must approve this contract first.
    function bet(uint8 rangeIndex, uint256 amount) external nonReentrant onlyOpen {
        require(block.timestamp < marketEndTime, "XenMarket: betting closed");
        require(msg.sender != creator, "XenMarket: creator cannot bet");
        require(amount > 0, "XenMarket: zero amount");
        require(rangeIndex < _ranges.length, "XenMarket: invalid range");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        userStake[msg.sender][rangeIndex] += amount;
        rangePool[rangeIndex]             += amount;
        totalPool                         += amount;

        emit BetPlaced(msg.sender, rangeIndex, amount);
    }

    // ─── Resolution ───────────────────────────────────────────────────────────

    /// @notice Resolve the market with the final metric value.
    ///         Only callable by trusted resolver after deadline.
    function resolve(
        uint8   _winningRangeIndex,
        uint256 _finalValue,
        bytes32 _evidenceHash
    ) external onlyResolver onlyAfterDeadline nonReentrant {
        require(state == MarketState.OPEN || state == MarketState.LOCKED, "XenMarket: not resolvable");
        require(!_resolved, "XenMarket: already resolved");
        require(_winningRangeIndex < _ranges.length, "XenMarket: invalid range index");
        require(_finalValueMatchesRange(_finalValue, _winningRangeIndex), "XenMarket: value/range mismatch");

        _resolved         = true;
        state             = MarketState.RESOLVED;
        finalValue        = _finalValue;
        winningRangeIndex = _winningRangeIndex;
        evidenceHash      = _evidenceHash;

        emit MarketResolved(_winningRangeIndex, _finalValue, _evidenceHash);
    }

    /// @notice Void the market and allow full refunds (no fee taken).
    function voidMarket(bytes32 reasonHash) external onlyResolver nonReentrant {
        require(state == MarketState.OPEN || state == MarketState.LOCKED, "XenMarket: not voidable");
        require(!_resolved, "XenMarket: already resolved");
        _resolved = true;
        state = MarketState.VOIDED;
        emit MarketVoided(reasonHash);
    }

    /// @notice Emergency cancel by factory only.
    function cancelMarket() external onlyFactory nonReentrant {
        require(state == MarketState.OPEN, "XenMarket: not cancellable");
        state = MarketState.CANCELLED;
        emit MarketCancelled();
    }

    // ─── Claims & Refunds ─────────────────────────────────────────────────────

    /// @notice Winners claim their pro-rata share of the losing pool minus protocol fee.
    function claim() external nonReentrant {
        require(state == MarketState.RESOLVED, "XenMarket: not resolved");

        uint256 stake = userStake[msg.sender][winningRangeIndex];
        require(stake > 0, "XenMarket: no stake in winning range");

        userStake[msg.sender][winningRangeIndex] = 0;

        uint256 payout = _calculatePayout(stake);
        require(payout > 0, "XenMarket: zero payout");

        usdc.safeTransfer(msg.sender, payout);
        emit Claimed(msg.sender, payout);
    }

    /// @notice Full refund when market is voided or cancelled.
    function refund() external nonReentrant {
        require(
            state == MarketState.VOIDED || state == MarketState.CANCELLED,
            "XenMarket: not refundable"
        );

        uint256 total = 0;
        uint8 len = uint8(_ranges.length);
        for (uint8 i = 0; i < len; i++) {
            uint256 s = userStake[msg.sender][i];
            if (s > 0) {
                userStake[msg.sender][i] = 0;
                total += s;
            }
        }

        require(total > 0, "XenMarket: nothing to refund");
        usdc.safeTransfer(msg.sender, total);
        emit Refunded(msg.sender, total);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function rangeCount() external view returns (uint8) {
        return uint8(_ranges.length);
    }

    function getRange(uint8 index) external view returns (Range memory) {
        require(index < _ranges.length, "XenMarket: out of bounds");
        return _ranges[index];
    }

    function getAllRanges() external view returns (Range[] memory) {
        return _ranges;
    }

    function getPool(uint8 rangeIndex) external view returns (uint256) {
        return rangePool[rangeIndex];
    }

    function getUserStake(address user, uint8 rangeIndex) external view returns (uint256) {
        return userStake[user][rangeIndex];
    }

    /// @notice Preview payout for a hypothetical stake in the winning range.
    function previewPayout(uint8 _rangeIndex, uint256 amount) external view returns (uint256) {
        if (state != MarketState.RESOLVED) return 0;
        if (_rangeIndex != winningRangeIndex) return 0;
        return _calculatePayout(amount);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _validateAndStoreRanges(Range[] memory ranges, uint256 sv) private {
        require(ranges[0].min >= sv, "XenMarket: first range below startValue");

        for (uint256 i = 0; i < ranges.length; i++) {
            Range memory r = ranges[i];
            bool isLast = (i == ranges.length - 1);

            require(r.difficulty >= 1 && r.difficulty <= 10, "XenMarket: bad difficulty");

            if (isLast) {
                require(r.maxOpen, "XenMarket: last range must be open");
                require(r.max == 0, "XenMarket: last range max must be 0");
            } else {
                require(!r.maxOpen, "XenMarket: only last range open");
                require(r.max > r.min, "XenMarket: max <= min");
                // next range must start where this one ends
                if (i + 1 < ranges.length) {
                    require(ranges[i + 1].min == r.max, "XenMarket: ranges must be contiguous");
                }
            }

            _ranges.push(r);
        }
    }

    function _finalValueMatchesRange(uint256 value, uint8 idx) private view returns (bool) {
        Range memory r = _ranges[idx];
        if (r.maxOpen) return value >= r.min;
        return value >= r.min && value < r.max;
    }

    function _calculatePayout(uint256 stake) private view returns (uint256) {
        uint256 winPool = rangePool[winningRangeIndex];
        if (winPool == 0) return stake; // no one else bet, return stake

        uint256 fee        = (totalPool * protocolFeeBps) / 10_000;
        uint256 payoutPool = totalPool - fee;

        // If nobody won (winning pool = 0), handled by resolve guard above.
        // Option A: if winPool > 0, distribute normally.
        return (payoutPool * stake) / winPool;
    }
}
