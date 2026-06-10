'use client'
import { useAccount, useBalance } from 'wagmi'
import { useQuery } from '@tanstack/react-query'

interface PortfolioBalance {
  cash:      string
  portfolio: string
  loading:   boolean
}

export function usePortfolioBalance(): PortfolioBalance {
  const { address, isConnected } = useAccount()

  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    query: { enabled: isConnected && !!address },
  })

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

  const cash = balance != null
    ? parseFloat(balance.formatted).toFixed(2)
    : '0.00'

  const portfolio = portfolioData?.totalStaked != null
    ? parseFloat(portfolioData.totalStaked).toFixed(2)
    : '0.00'

  return { cash, portfolio, loading: balanceLoading || portfolioLoading }
}
