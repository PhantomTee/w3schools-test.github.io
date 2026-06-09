/**
 * Arc deployer wallet setup.
 *
 * - If ARC_DEPLOYER_KEY is set  → derive address, continue.
 * - If not set                  → generate fresh wallet, mask key,
 *                                  print for user to save, exit 0
 *                                  (remaining deploy steps are skipped).
 *
 * Writes to $GITHUB_OUTPUT:
 *   wallet_generated  = true | false
 *   deployer_address  = 0x…
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
  NEW WALLET GENERATED

  Save this in GitHub Settings → Secrets → Actions:
    Secret name  : ARC_DEPLOYER_KEY
    Secret value : ${key}

  Deployer address : ${address}

  Next steps:
    1. Copy ARC_DEPLOYER_KEY above and add it as a repo secret.
    2. Fund ${address} on Arc testnet.
    3. Re-run this workflow — it will deploy the contracts.
=================================================================
`)
  // Exit 0 — not an error, user just needs to fund first
  process.exit(0)
}

console.log(`Deployer address: ${address}`)
