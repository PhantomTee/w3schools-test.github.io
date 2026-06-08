// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IYieldAdapter} from "../interfaces/IYieldAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Passthrough yield adapter — holds USDC idle, no yield routing.
/// Used when ENABLE_USYC_YIELD=false (default for MVP).
contract NoYieldAdapter is IYieldAdapter {
    address public immutable override underlying;
    uint256 private _deposited;

    constructor(address usdc) {
        underlying = usdc;
    }

    function deposit(uint256 amount) external override {
        IERC20(underlying).transferFrom(msg.sender, address(this), amount);
        _deposited += amount;
    }

    function withdraw(uint256 amount) external override {
        require(amount <= _deposited, "NoYieldAdapter: insufficient");
        _deposited -= amount;
        IERC20(underlying).transfer(msg.sender, amount);
    }

    function totalAssets() external view override returns (uint256) {
        return _deposited;
    }
}
