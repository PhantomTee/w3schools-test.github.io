// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {XenMarket} from "../src/XenMarket.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract XenMarketTest is Test {
    MockUSDC usdc;
    XenMarket market;

    address factory  = makeAddr("factory");
    address creator  = makeAddr("creator");
    address resolver = makeAddr("resolver");
    address alice    = makeAddr("alice");
    address bob      = makeAddr("bob");

    uint256 START_VALUE  = 1200;
    uint256 END_TIME;

    XenMarket.Range[] ranges;

    function setUp() public {
        usdc = new MockUSDC();
        END_TIME = block.timestamp + 3 hours;

        ranges.push(XenMarket.Range(1200, 2000,  false, "1.2k-2k", 2));
        ranges.push(XenMarket.Range(2000, 4000,  false, "2k-4k",   4));
        ranges.push(XenMarket.Range(4000, 7000,  false, "4k-7k",   6));
        ranges.push(XenMarket.Range(7000, 12000, false, "7k-12k",  8));
        ranges.push(XenMarket.Range(12000, 0,   true,  "12k+",    10));

        vm.prank(factory);
        market = new XenMarket(
            address(usdc),
            factory,
            creator,
            resolver,
            "1234567890",
            keccak256("user123"),
            0, // FINAL_VIEWS
            START_VALUE,
            block.timestamp,
            END_TIME,
            ranges,
            100 // 1% fee
        );

        usdc.mint(alice, 100e6);
        usdc.mint(bob,   100e6);
        vm.prank(alice); usdc.approve(address(market), type(uint256).max);
        vm.prank(bob);   usdc.approve(address(market), type(uint256).max);
    }

    // ── Betting ──────────────────────────────────────────────────────────────

    function test_bet_succeeds() public {
        vm.prank(alice);
        market.bet(2, 10e6); // 10 USDC into range "4k-7k"

        assertEq(market.rangePool(2), 10e6);
        assertEq(market.totalPool(), 10e6);
        assertEq(market.getUserStake(alice, 2), 10e6);
    }

    function test_bet_creator_reverts() public {
        vm.prank(creator);
        vm.expectRevert("XenMarket: creator cannot bet");
        market.bet(2, 10e6);
    }

    function test_bet_after_deadline_reverts() public {
        vm.warp(END_TIME + 1);
        vm.prank(alice);
        vm.expectRevert("XenMarket: betting closed");
        market.bet(2, 10e6);
    }

    function test_bet_zero_amount_reverts() public {
        vm.prank(alice);
        vm.expectRevert("XenMarket: zero amount");
        market.bet(2, 0);
    }

    function test_bet_invalid_range_reverts() public {
        vm.prank(alice);
        vm.expectRevert("XenMarket: invalid range");
        market.bet(99, 10e6);
    }

    // ── Resolution ───────────────────────────────────────────────────────────

    function test_resolve_winning_range() public {
        vm.prank(alice); market.bet(2, 10e6); // 4k-7k
        vm.prank(bob);   market.bet(1, 5e6);  // 2k-4k

        vm.warp(END_TIME + 1);
        vm.prank(resolver);
        market.resolve(2, 6800, keccak256("evidence"));

        assertEq(uint8(market.state()), uint8(XenMarket.MarketState.RESOLVED));
        assertEq(market.winningRangeIndex(), 2);
        assertEq(market.finalValue(), 6800);
    }

    function test_resolve_before_deadline_reverts() public {
        vm.prank(resolver);
        vm.expectRevert("XenMarket: market not expired");
        market.resolve(2, 6800, bytes32(0));
    }

    function test_resolve_value_range_mismatch_reverts() public {
        vm.warp(END_TIME + 1);
        vm.prank(resolver);
        vm.expectRevert("XenMarket: value/range mismatch");
        // finalValue=3000 but we say range 2 (4k-7k)
        market.resolve(2, 3000, bytes32(0));
    }

    function test_resolve_double_reverts() public {
        vm.warp(END_TIME + 1);
        vm.prank(resolver); market.resolve(2, 6800, bytes32(0));
        vm.prank(resolver);
        vm.expectRevert("XenMarket: already resolved");
        market.resolve(2, 6800, bytes32(0));
    }

    // ── Claims ────────────────────────────────────────────────────────────────

    function test_claim_winner_correct_payout() public {
        vm.prank(alice); market.bet(2, 10e6); // winning range
        vm.prank(bob);   market.bet(1, 5e6);  // losing range

        vm.warp(END_TIME + 1);
        vm.prank(resolver);
        market.resolve(2, 6800, bytes32(0));

        uint256 balBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        market.claim();
        uint256 balAfter = usdc.balanceOf(alice);

        // totalPool = 15e6, fee = 1% = 150000, payoutPool = 14850000
        // alice is only winner: payout = 14850000
        uint256 expected = (15e6 * 9900) / 10000; // ~14.85 USDC
        assertEq(balAfter - balBefore, expected);
    }

    function test_claim_loser_reverts() public {
        vm.prank(alice); market.bet(2, 10e6);
        vm.prank(bob);   market.bet(1, 5e6);

        vm.warp(END_TIME + 1);
        vm.prank(resolver); market.resolve(2, 6800, bytes32(0));

        vm.prank(bob);
        vm.expectRevert("XenMarket: no stake in winning range");
        market.claim();
    }

    function test_claim_double_reverts() public {
        vm.prank(alice); market.bet(2, 10e6);
        vm.warp(END_TIME + 1);
        vm.prank(resolver); market.resolve(2, 6800, bytes32(0));

        vm.prank(alice); market.claim();
        vm.prank(alice);
        vm.expectRevert("XenMarket: no stake in winning range");
        market.claim();
    }

    // ── Void & Refund ─────────────────────────────────────────────────────────

    function test_void_and_refund() public {
        vm.prank(alice); market.bet(2, 10e6);
        vm.prank(bob);   market.bet(3, 7e6);

        vm.prank(resolver);
        market.voidMarket(keccak256("tweet deleted"));

        assertEq(uint8(market.state()), uint8(XenMarket.MarketState.VOIDED));

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice); market.refund();
        assertEq(usdc.balanceOf(alice) - aliceBefore, 10e6);

        uint256 bobBefore = usdc.balanceOf(bob);
        vm.prank(bob); market.refund();
        assertEq(usdc.balanceOf(bob) - bobBefore, 7e6);
    }

    // ── Range validation ──────────────────────────────────────────────────────

    function test_range_validation_open_ended_last() public {
        // Already tested implicitly via setUp; verify accessor
        XenMarket.Range memory last = market.getRange(4);
        assertTrue(last.maxOpen);
        assertEq(last.max, 0);
        assertEq(last.min, 12000);
    }

    function test_finalValue_in_open_range() public {
        vm.prank(alice); market.bet(4, 5e6); // 12k+
        vm.warp(END_TIME + 1);
        vm.prank(resolver);
        market.resolve(4, 999999, bytes32(0)); // very high value
        assertEq(market.winningRangeIndex(), 4);
    }
}
