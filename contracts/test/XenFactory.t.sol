// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {XenFactory} from "../src/XenFactory.sol";
import {XenMarket} from "../src/XenMarket.sol";
import {MockUSDC} from "./MockUSDC.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract XenFactoryTest is Test {
    XenFactory factory;
    MockUSDC   usdc;

    uint256 signerKey  = 0xA11CE;
    address signer     = vm.addr(signerKey);
    address resolver   = makeAddr("resolver");
    address treasury   = makeAddr("treasury");
    address owner      = makeAddr("owner");
    address creator    = makeAddr("creator");

    XenFactory.RangeInput[] ranges;

    function setUp() public {
        usdc = new MockUSDC();
        factory = new XenFactory(
            address(usdc),
            resolver,
            signer,
            treasury,
            owner
        );

        usdc.mint(creator, 100e6);
        vm.prank(creator);
        usdc.approve(address(factory), type(uint256).max);

        ranges.push(XenFactory.RangeInput(1200, 2000,  false, "1.2k-2k", 2));
        ranges.push(XenFactory.RangeInput(2000, 4000,  false, "2k-4k",   4));
        ranges.push(XenFactory.RangeInput(4000, 7000,  false, "4k-7k",   6));
        ranges.push(XenFactory.RangeInput(7000, 12000, false, "7k-12k",  8));
        ranges.push(XenFactory.RangeInput(12000, 0,   true,  "12k+",    10));
    }

    function _buildConfig(uint256 nonce) internal view returns (XenFactory.MarketConfigInput memory) {
        return XenFactory.MarketConfigInput({
            creator:             creator,
            xUserIdHash:         keccak256("xuser123"),
            tweetId:             "tweet1",
            metricType:          0,
            startValue:          1200,
            createdAt:           block.timestamp,
            marketStartTime:     block.timestamp,
            marketEndTime:       block.timestamp + 3 hours,
            rangesHash:          keccak256(abi.encode(ranges)),
            marketQuestionHash:  keccak256("What will final views be?"),
            genLayerReportHash:  keccak256("genlayer-report"),
            nonce:               nonce
        });
    }

    function _signConfig(XenFactory.MarketConfigInput memory config) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(
            factory.MARKET_CONFIG_TYPEHASH(),
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
        bytes32 digest = MessageHashUtils.toTypedDataHash(factory.DOMAIN_SEPARATOR(), structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_createMarket_success() public {
        XenFactory.MarketConfigInput memory config = _buildConfig(1);
        bytes memory sig = _signConfig(config);

        vm.prank(creator);
        (uint256 mId, address mAddr) = factory.createMarket(config, ranges, sig);

        assertEq(mId, 1);
        assertTrue(mAddr != address(0));
        assertEq(factory.marketCount(), 1);
        assertEq(usdc.balanceOf(treasury), 500_000); // creation fee
    }

    function test_createMarket_replay_reverts() public {
        XenFactory.MarketConfigInput memory config = _buildConfig(1);
        bytes memory sig = _signConfig(config);

        vm.prank(creator); factory.createMarket(config, ranges, sig);
        vm.prank(creator);
        vm.expectRevert("XenFactory: nonce used");
        factory.createMarket(config, ranges, sig);
    }

    function test_createMarket_daily_limit() public {
        for (uint256 i = 1; i <= 10; i++) {
            // Each market needs a different tweetId to avoid tweet limit
            XenFactory.MarketConfigInput memory config = XenFactory.MarketConfigInput({
                creator:             creator,
                xUserIdHash:         keccak256("xuser123"),
                tweetId:             string(abi.encodePacked("tweet", vm.toString(i))),
                metricType:          0,
                startValue:          1200,
                createdAt:           block.timestamp,
                marketStartTime:     block.timestamp,
                marketEndTime:       block.timestamp + 3 hours,
                rangesHash:          keccak256(abi.encode(ranges)),
                marketQuestionHash:  keccak256("q"),
                genLayerReportHash:  keccak256("gl"),
                nonce:               i
            });
            bytes memory sig = _signConfig(config);
            vm.prank(creator);
            factory.createMarket(config, ranges, sig);
        }

        XenFactory.MarketConfigInput memory config11 = _buildConfig(11);
        config11.tweetId = "tweet11";
        config11.rangesHash = keccak256(abi.encode(ranges));
        bytes memory sig11 = _signConfig(config11);

        vm.prank(creator);
        vm.expectRevert("XenFactory: daily market limit reached");
        factory.createMarket(config11, ranges, sig11);
    }

    function test_createMarket_invalid_signature_reverts() public {
        XenFactory.MarketConfigInput memory config = _buildConfig(1);
        bytes memory badSig = new bytes(65);

        vm.prank(creator);
        vm.expectRevert();
        factory.createMarket(config, ranges, badSig);
    }
}
