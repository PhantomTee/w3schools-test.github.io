/**
 * Deploy XenMarketAI.py to GenLayer Studionet.
 *
 * - If GENLAYER_DEPLOYER_KEY is set: uses that wallet.
 * - If not set:                      generates a fresh wallet, masks the key
 *                                    in CI logs, and prints it for you to save
 *                                    as the GENLAYER_DEPLOYER_KEY secret.
 *
 * Always funds the deployer via sim_fundAccount (Studionet test tokens, free).
 * Outputs GENLAYER_CONTRACT_ADDRESS to stdout and to $GITHUB_OUTPUT.
 */

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createClient, chains } from 'genlayer-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

// ── 1. Wallet ─────────────────────────────────────────────────────────────────

let privateKey = (process.env.GENLAYER_DEPLOYER_KEY ?? '').trim()
let generated  = false

if (!privateKey || privateKey === '0x' + '0'.repeat(64)) {
  privateKey = generatePrivateKey()
  generated  = true
  // Mask BEFORE printing anything so CI never logs the raw key
  if (process.env.CI) console.log(`::add-mask::${privateKey}`)
}

const account = privateKeyToAccount(privateKey)
console.log(`Deployer address : ${account.address}`)

if (generated) {
  console.log(`
==============================================================
  NEW WALLET GENERATED — save these before the job ends:

  GitHub secret name : GENLAYER_DEPLOYER_KEY
  Secret value       : ${privateKey}

  Deployer address   : ${account.address}
  (also fund this address on Arc testnet for Solidity deploy)
==============================================================
`)
}

// ── 2. Fund via sim_fundAccount ───────────────────────────────────────────────

const RPC = process.env.GENLAYER_NODE_URL || 'https://studio.genlayer.com/api'
console.log(`\nFunding ${account.address} on GenLayer Studionet (${RPC})...`)

// Build body manually — amount must be a JSON integer, not a string.
// JSON.stringify would quote BigInt; a JS number loses precision at this scale.
const fundBody = `{"jsonrpc":"2.0","id":1,"method":"sim_fundAccount","params":["${account.address}",10000000000000000000000]}`

const fundRes = await fetch(RPC, {
  method : 'POST',
  headers: { 'Content-Type': 'application/json' },
  body   : fundBody,
})

if (!fundRes.ok) {
  throw new Error(`GenLayer RPC HTTP ${fundRes.status}: ${await fundRes.text()}`)
}
const fundJson = await fundRes.json()
if (fundJson.error) {
  throw new Error(`sim_fundAccount failed: ${JSON.stringify(fundJson.error)}`)
}
console.log('Funded ✓')

// ── 3. Deploy XenMarketAI.py ──────────────────────────────────────────────────

const contractPath = path.join(ROOT, 'contracts', 'genlayer', 'XenMarketAI.py')
const code         = fs.readFileSync(contractPath, 'utf-8')

console.log('\nConnecting to GenLayer Studionet...')

const clientOpts = { chain: chains.studionet, account }
if (process.env.GENLAYER_NODE_URL) clientOpts.endpoint = process.env.GENLAYER_NODE_URL

const client = createClient(clientOpts)

console.log('Sending deployment transaction...')

const hash = await client.deployContract({
  code,
  args      : [],
  leaderOnly: false,
})
console.log(`Deploy tx : ${hash}`)

console.log('Waiting for receipt (up to ~90 s on Studionet)...')

const receipt = await client.waitForTransactionReceipt({
  hash,
  timeout: 90_000,
})

const contractAddress = receipt?.contractAddress
if (!contractAddress) {
  console.error('Receipt:', JSON.stringify(receipt, null, 2))
  throw new Error('No contractAddress in receipt — deployment may have failed')
}

// ── 4. Output ─────────────────────────────────────────────────────────────────

console.log(`
==============================================================
  ✅  XenMarketAI deployed!

  Contract address : ${contractAddress}
  Deployer         : ${account.address}

  Add to your environment (Vercel + .env):
    GENLAYER_CONTRACT_ADDRESS=${contractAddress}
==============================================================
`)

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `contract_address=${contractAddress}\n`)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `deployer_address=${account.address}\n`)
}
