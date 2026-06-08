// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Interface for optional idle-pool yield routing (e.g. USYC on Arc).
/// Default implementation is NoYieldAdapter (no-op). Only activate when an
/// official USYC contract address and redemption mechanics are available.
interface IYieldAdapter {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function totalAssets() external view returns (uint256);
    function underlying() external view returns (address);
}
