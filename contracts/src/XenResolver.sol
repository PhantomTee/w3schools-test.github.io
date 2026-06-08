// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {XenMarket} from "./XenMarket.sol";

/// @title XenResolver
/// @notice Trusted resolver that settles XenMarket contracts.
///         The backend acts as the primary resolver key. GenLayer dispute
///         results are forwarded by the backend through this contract.
contract XenResolver is Ownable, Pausable {

    address public resolverKey;  // EOA controlled by backend

    event MarketResolved(address indexed market, uint8 winningIndex, uint256 finalValue);
    event MarketVoided(address indexed market, bytes32 reason);
    event ResolverKeyUpdated(address newKey);

    modifier onlyResolverKey() {
        require(msg.sender == resolverKey, "XenResolver: not resolver key");
        _;
    }

    constructor(address _resolverKey, address _owner) Ownable(_owner) {
        resolverKey = _resolverKey;
    }

    /// @notice Resolve a market with the final metric value.
    function resolveMarket(
        address marketAddress,
        uint8   winningRangeIndex,
        uint256 finalValue,
        bytes32 evidenceHash
    ) external onlyResolverKey whenNotPaused {
        XenMarket(marketAddress).resolve(winningRangeIndex, finalValue, evidenceHash);
        emit MarketResolved(marketAddress, winningRangeIndex, finalValue);
    }

    /// @notice Void a market (e.g. tweet deleted, X API unavailable, GenLayer unresolvable).
    function voidMarket(
        address marketAddress,
        bytes32 reasonHash
    ) external onlyResolverKey whenNotPaused {
        XenMarket(marketAddress).voidMarket(reasonHash);
        emit MarketVoided(marketAddress, reasonHash);
    }

    function setResolverKey(address newKey) external onlyOwner {
        resolverKey = newKey;
        emit ResolverKeyUpdated(newKey);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
