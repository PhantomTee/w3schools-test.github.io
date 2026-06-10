import { defineChain } from 'viem'

/**
 * Arc — Circle's open L1 blockchain, purpose-built for stablecoin finance.
 * Native gas token is USDC (ERC-20 at 0x3600…0000, 6 decimals).
 * Docs: https://arc.network  |  Faucet: https://faucet.circle.com
 */
export const arcChain = defineChain({
  id:   parseInt(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? '5042002'),
  name: process.env.NEXT_PUBLIC_ARC_CHAIN_NAME ?? 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name:     'USDC',
    symbol:   'USDC',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC_URL ?? 'https://rpc.testnet.arc.network'],
      webSocket: ['wss://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url:  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
})

export const SUPPORTED_CHAINS = [arcChain]
