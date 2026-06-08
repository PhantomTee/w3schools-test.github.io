'use client'
import { createConfig, http } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { arcChain } from './chains'

export const wagmiConfig = createConfig({
  chains:     [arcChain],
  connectors: [injected(), metaMask()],
  transports: {
    [arcChain.id]: http(arcChain.rpcUrls.default.http[0]),
  },
})
