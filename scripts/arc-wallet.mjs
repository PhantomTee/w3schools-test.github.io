/**
 * Arc deployer wallet setup.
 *
 * One wallet covers everything: deployer, resolver, signer, treasury.
 *
 * - If ARC_DEPLOYER_KEY is set  → derive address, continue.
 * - If not set                  → generate fresh wallet, mask key,
 *                                  print private key + address, exit 0
 *                                  (remaining deploy steps are skipped).
 *
 * Writes to $GITHUB_OUTPUT:
 *   wallet_generated  = true | false
 *   deployer_address  = 0x...
 */

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import fs from 'node:fs'

let key       = (process.env.ARC_DEPLOYER_KEY ?? '').trim()
let generated = false

if (!key || key === '0x' + '0'.repeat(64)) {
  key       = generatePrivateKey()
  generated = true
  // Mask BEFORE any console output so CI never logs the raw key
  if (process.env.CI) console.log(`::add-mask::${key}`)
}

const { address } = privateKeyToAccount(key)

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `wallet_generated=${generated}\n`)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `deployer_address=${address}\n`)
}

if (generated) {
  console.log(`
=================================================================
  NEW ARC WALLET GENERATED

  PRIVATE KEY (shown only once — copy it now):
  ${key}

  Address : ${address}

  This one wallet is used for: deployer, resolver, signer, treasury.

  Steps:
    1. Copy the private key above.
    2. Add it as a GitHub secret:
         Name  : ARC_DEPLOYER_KEY
         Value : (the private key above)
    3. Fund ${address} on Arc testnet:
         Faucet: https://faucet.circle.com
    4. Re-run this workflow to deploy contracts.
=================================================================
`)
  // Exit 0 — not an error, user just needs to fund and save the key first
  process.exit(0)
}

console.log(`Deployer address: ${address}`)
