// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {XenFactory} from "../src/XenFactory.sol";
import {XenResolver} from "../src/XenResolver.sol";

/// @notice Deployment script for Arc testnet / mainnet.
///
/// Required env vars (set in .env or CI):
///   DEPLOYER_PRIVATE_KEY     – deployer wallet key
///   RESOLVER_KEY_ADDRESS     – backend resolver EOA address
///   TRUSTED_SIGNER_ADDRESS   – backend market-config signer address
///   TREASURY_ADDRESS         – protocol treasury address
///   ARC_USDC_ADDRESS         – official USDC contract on Arc (see Arc docs)
///
/// Run:
///   forge script script/Deploy.s.sol \
///     --rpc-url $ARC_RPC_URL \
///     --broadcast \
///     --verify \
///     --etherscan-api-key $ARC_EXPLORER_API_KEY
contract Deploy is Script {
    function run() external {
        uint256 deployerKey      = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployerAddr     = vm.addr(deployerKey);
        address resolverKeyAddr  = vm.envAddress("RESOLVER_KEY_ADDRESS");
        address trustedSigner    = vm.envAddress("TRUSTED_SIGNER_ADDRESS");
        address treasury         = vm.envAddress("TREASURY_ADDRESS");
        address usdc             = vm.envAddress("ARC_USDC_ADDRESS");

        vm.startBroadcast(deployerKey);

        // 1. Deploy XenResolver
        XenResolver resolver = new XenResolver(resolverKeyAddr, deployerAddr);
        console2.log("XenResolver:", address(resolver));

        // 2. Deploy XenFactory (resolver address is the XenResolver contract)
        XenFactory factory = new XenFactory(
            usdc,
            address(resolver),
            trustedSigner,
            treasury,
            deployerAddr
        );
        console2.log("XenFactory:", address(factory));

        vm.stopBroadcast();

        console2.log("\n=== Xen Deployment Complete ===");
        console2.log("Network Chain ID:", block.chainid);
        console2.log("USDC:            ", usdc);
        console2.log("XenResolver:     ", address(resolver));
        console2.log("XenFactory:      ", address(factory));
        console2.log("\nAdd to .env:");
        console2.log("NEXT_PUBLIC_XEN_FACTORY_ADDRESS=", address(factory));
        console2.log("NEXT_PUBLIC_XEN_RESOLVER_ADDRESS=", address(resolver));
    }
}
