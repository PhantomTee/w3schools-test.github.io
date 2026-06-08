import { defineChain } from 'viem'

/**
 * Arc network configuration.
 * Fill in official values from https://arc.net/docs (network config / RPC / testnet).
 * All values default to env vars set in .env.local.
 */
export const arcChain = defineChain({
  id:   parseInt(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? '50104'),
  name: process.env.NEXT_PUBLIC_ARC_CHAIN_NAME ?? 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name:     'Ether',
    symbol:   'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC_URL ?? 'https://rpc.arc-testnet.example.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url:  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? 'https://explorer.arc-testnet.example.com',
    },
  },
  testnet: true,
})

export const SUPPORTED_CHAINS = [arcChain]
