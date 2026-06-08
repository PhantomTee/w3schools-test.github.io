// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {XenMarket} from "./XenMarket.sol";

/// @title XenFactory
/// @notice Creates and tracks XenMarket instances. Enforces backend/GenLayer
///         signed market configs via EIP-712 to prevent users bypassing validation.
contract XenFactory is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ─── Config ───────────────────────────────────────────────────────────────

    IERC20  public immutable usdc;
    address public           trustedResolver;
    address public           treasury;
    address public           trustedSigner;  // backend signs MarketConfig

    uint256 public creationFee   = 500_000;  // 0.5 USDC (6 decimals)
    uint16  public settlementBps = 100;       // 1%
    uint256 public constant MAX_MARKETS_PER_DAY   = 10;
    uint256 public constant MAX_MARKETS_PER_TWEET = 3;
    uint256 public constant MAX_DURATION_SECONDS  = 48 hours;

    // ─── EIP-712 ──────────────────────────────────────────────────────────────

    bytes32 public immutable DOMAIN_SEPARATOR;

    // keccak256("MarketConfig(address creator,bytes32 xUserIdHash,string tweetId,uint8 metricType,uint256 startValue,uint256 createdAt,uint256 marketStartTime,uint256 marketEndTime,bytes32 rangesHash,bytes32 marketQuestionHash,bytes32 genLayerReportHash,uint256 nonce)")
    bytes32 public constant MARKET_CONFIG_TYPEHASH = 0x8d7b4b4ac8ab3a3b6b7b4b4ac8ab3a3b6b7b4b4ac8ab3a3b6b7b4b4ac8ab3a3b;

    // ─── Registry ─────────────────────────────────────────────────────────────

    struct MarketInfo {
        address marketAddress;
        address creator;
        string  tweetId;
        uint256 createdAt;
    }

    uint256 public marketCount;
    mapping(uint256 => MarketInfo) public markets;
    mapping(address => uint256[])  public creatorMarkets;
    mapping(string  => uint256[])  public tweetMarkets;   // tweetId → marketIds
    mapping(address => uint256)    private _creatorDailyCount;
    mapping(address => uint256)    private _creatorLastDay;
    mapping(uint256 => bool)       public  usedNonces;    // nonce → used

    // ─── Events ───────────────────────────────────────────────────────────────

    event MarketCreated(
        uint256 indexed marketId,
        address indexed marketAddress,
        address indexed creator,
        string  tweetId,
        uint8   metricType,
        uint256 marketEndTime
    );
    event TrustedResolverUpdated(address resolver);
    event TrustedSignerUpdated(address signer);
    event TreasuryUpdated(address treasury);
    event CreationFeeUpdated(uint256 fee);
    event SettlementBpsUpdated(uint16 bps);

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct MarketConfigInput {
        address  creator;
        bytes32  xUserIdHash;
        string   tweetId;
        uint8    metricType;
        uint256  startValue;
        uint256  createdAt;
        uint256  marketStartTime;
        uint256  marketEndTime;
        bytes32  rangesHash;
        bytes32  marketQuestionHash;
        bytes32  genLayerReportHash;
        uint256  nonce;
    }

    struct RangeInput {
        uint256 min;
        uint256 max;
        bool    maxOpen;
        string  label;
        uint8   difficulty;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _trustedResolver,
        address _trustedSigner,
        address _treasury,
        address _owner
    ) Ownable(_owner) {
        usdc            = IERC20(_usdc);
        trustedResolver = _trustedResolver;
        trustedSigner   = _trustedSigner;
        treasury        = _treasury;

        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("Xen"),
            keccak256("1"),
            block.chainid,
            address(this)
        ));
    }

    // ─── Market Creation ──────────────────────────────────────────────────────

    /// @notice Create a new market. `config` must be signed by `trustedSigner`.
    /// @param config     Validated market parameters (produced by backend + GenLayer).
    /// @param ranges     Range definitions. Their keccak256 must equal config.rangesHash.
    /// @param signature  EIP-712 signature from trustedSigner.
    function createMarket(
        MarketConfigInput calldata config,
        RangeInput[]      calldata ranges,
        bytes             calldata signature
    ) external whenNotPaused nonReentrant returns (uint256 marketId, address marketAddress) {
        // ── Signature verification ──────────────────────────────────────────
        _verifySignature(config, signature);

        // ── Ranges hash verification ────────────────────────────────────────
        require(
            keccak256(abi.encode(ranges)) == config.rangesHash,
            "XenFactory: ranges hash mismatch"
        );

        // ── Caller must be creator ──────────────────────────────────────────
        require(msg.sender == config.creator, "XenFactory: not creator");

        // ── Daily limit ─────────────────────────────────────────────────────
        _checkAndUpdateDailyCount(config.creator);

        // ── Tweet market cap ────────────────────────────────────────────────
        require(
            tweetMarkets[config.tweetId].length < MAX_MARKETS_PER_TWEET,
            "XenFactory: tweet market limit reached"
        );

        // ── Duration check ──────────────────────────────────────────────────
        require(
            config.marketEndTime > config.marketStartTime,
            "XenFactory: invalid duration"
        );
        require(
            config.marketEndTime - config.marketStartTime <= MAX_DURATION_SECONDS,
            "XenFactory: duration exceeds 48h"
        );
        require(
            config.marketEndTime > block.timestamp,
            "XenFactory: end time in past"
        );

        // ── Creation fee ─────────────────────────────────────────────────────
        usdc.safeTransferFrom(msg.sender, treasury, creationFee);

        // ── Deploy market ────────────────────────────────────────────────────
        XenMarket.Range[] memory mranges = _convertRanges(ranges);
        XenMarket market = new XenMarket(
            address(usdc),
            address(this),
            config.creator,
            trustedResolver,
            config.tweetId,
            config.xUserIdHash,
            config.metricType,
            config.startValue,
            config.marketStartTime,
            config.marketEndTime,
            mranges,
            settlementBps
        );

        marketId      = ++marketCount;
        marketAddress = address(market);

        markets[marketId] = MarketInfo({
            marketAddress: marketAddress,
            creator:       config.creator,
            tweetId:       config.tweetId,
            createdAt:     block.timestamp
        });

        creatorMarkets[config.creator].push(marketId);
        tweetMarkets[config.tweetId].push(marketId);

        emit MarketCreated(
            marketId,
            marketAddress,
            config.creator,
            config.tweetId,
            config.metricType,
            config.marketEndTime
        );
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setTrustedResolver(address _resolver) external onlyOwner {
        trustedResolver = _resolver;
        emit TrustedResolverUpdated(_resolver);
    }

    function setTrustedSigner(address _signer) external onlyOwner {
        trustedSigner = _signer;
        emit TrustedSignerUpdated(_signer);
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setCreationFee(uint256 _fee) external onlyOwner {
        creationFee = _fee;
        emit CreationFeeUpdated(_fee);
    }

    function setSettlementBps(uint16 _bps) external onlyOwner {
        require(_bps <= 1000, "XenFactory: max 10%");
        settlementBps = _bps;
        emit SettlementBpsUpdated(_bps);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getMarket(uint256 marketId) external view returns (MarketInfo memory) {
        return markets[marketId];
    }

    function getMarketsByCreator(address creator) external view returns (uint256[] memory) {
        return creatorMarkets[creator];
    }

    function getMarketsByTweet(string calldata tId) external view returns (uint256[] memory) {
        return tweetMarkets[tId];
    }

    function creatorDailyCount(address creator) external view returns (uint256) {
        if (_creatorLastDay[creator] != _today()) return 0;
        return _creatorDailyCount[creator];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _verifySignature(MarketConfigInput calldata config, bytes calldata sig) private {
        require(!usedNonces[config.nonce], "XenFactory: nonce used");

        bytes32 structHash = keccak256(abi.encode(
            MARKET_CONFIG_TYPEHASH,
            config.creator,
            config.xUserIdHash,
            keccak256(bytes(config.tweetId)),
            config.metricType,
            config.startValue,
            config.createdAt,
            config.marketStartTime,
            config.marketEndTime,
            config.rangesHash,
            config.marketQuestionHash,
            config.genLayerReportHash,
            config.nonce
        ));

        bytes32 digest = MessageHashUtils.toTypedDataHash(DOMAIN_SEPARATOR, structHash);
        address signer = ECDSA.recover(digest, sig);
        require(signer == trustedSigner, "XenFactory: invalid signature");

        usedNonces[config.nonce] = true;
    }

    function _checkAndUpdateDailyCount(address creator) private {
        uint256 today = _today();
        if (_creatorLastDay[creator] != today) {
            _creatorDailyCount[creator] = 0;
            _creatorLastDay[creator]    = today;
        }
        require(
            _creatorDailyCount[creator] < MAX_MARKETS_PER_DAY,
            "XenFactory: daily market limit reached"
        );
        _creatorDailyCount[creator]++;
    }

    function _today() private view returns (uint256) {
        return block.timestamp / 1 days;
    }

    function _convertRanges(RangeInput[] calldata inputs)
        private
        pure
        returns (XenMarket.Range[] memory out)
    {
        out = new XenMarket.Range[](inputs.length);
        for (uint256 i = 0; i < inputs.length; i++) {
            out[i] = XenMarket.Range({
                min:        inputs[i].min,
                max:        inputs[i].max,
                maxOpen:    inputs[i].maxOpen,
                label:      inputs[i].label,
                difficulty: inputs[i].difficulty
            });
        }
    }
}
