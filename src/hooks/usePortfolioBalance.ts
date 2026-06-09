'use client'
import { useAccount, useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { formatUnits } from 'viem'
import { ERC20_ABI } from '@/config/abi'
import { CONTRACT_ADDRESSES } from '@/config/contracts'

const USDC_ADDRESS = CONTRACT_ADDRESSES.USDC

interface PortfolioBalance {
  cash:      string   // formatted USDC balance on-chain
  portfolio: string   // sum of active stakes in open markets
  loading:   boolean
}

export function usePortfolioBalance(): PortfolioBalance {
  const { address, isConnected } = useAccount()

  // On-chain USDC balance
  const { data: rawBalance, isLoading: balanceLoading } = useReadContract({
    address:      USDC_ADDRESS as `0x${string}`,
    abi:          ERC20_ABI,
    functionName: 'balanceOf',
    args:         address ? [address] : undefined,
    query:        { enabled: isConnected && !!address },
  })

  // Active stakes from API
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey:  ['portfolio', address],
    queryFn:   async () => {
      const res = await fetch('/api/me/portfolio')
      if (!res.ok) return { totalStaked: '0' }
      return res.json()
    },
    enabled:   isConnected && !!address,
    staleTime: 30_000,
    retry:     false,
  })

  const cash = rawBalance != null
    ? parseFloat(formatUnits(rawBalance as bigint, 6)).toFixed(2)
    : '0.00'

  const portfolio = portfolioData?.totalStaked != null
    ? parseFloat(portfolioData.totalStaked).toFixed(2)
    : '0.00'

  return {
    cash,
    portfolio,
    loading: balanceLoading || portfolioLoading,
  }
}
