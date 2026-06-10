'use client'
import { useState } from 'react'
import { useWriteContract } from 'wagmi'
import { Button } from '@/components/ui/button'
import { XEN_MARKET_ABI } from '@/config/abi'

interface Props {
  contractAddress:   string
  state:             string
  winningRangeIndex: number | null
  userStakes:        Array<{ rangeIndex: number; amount: string; claimed: boolean }>
}

export function ClaimRefundButton({ contractAddress, state, winningRangeIndex, userStakes }: Props) {
  const { writeContractAsync } = useWriteContract()
  const [loading, setLoading]  = useState(false)
  const [done, setDone]        = useState(false)
  const [error, setError]      = useState<string | null>(null)

  const hasWinningStake = state === 'RESOLVED' && winningRangeIndex != null &&
    userStakes.some(s => s.rangeIndex === winningRangeIndex && !s.claimed && BigInt(s.amount) > 0n)
  const hasRefundableStake = (state === 'VOIDED' || state === 'CANCELLED') &&
    userStakes.some(s => BigInt(s.amount) > 0n)

  async function handleAction(fn: 'claim' | 'refund') {
    setError(null)
    setLoading(true)
    try {
      await writeContractAsync({
        address:      contractAddress as `0x${string}`,
        abi:          XEN_MARKET_ABI,
        functionName: fn,
        args:         [],
      })
      setDone(true)
    } catch (e) {
      setError((e as Error).message.slice(0, 150))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="py-4 text-center space-y-1">
        <p className="text-[var(--ink)] font-semibold">Transaction confirmed</p>
        <p className="text-[13px] text-[#64748B]">USDC sent to your wallet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {hasWinningStake && (
        <Button variant="xen" className="w-full" onClick={() => handleAction('claim')} disabled={loading}>
          {loading ? 'Claiming...' : 'Claim USDC'}
        </Button>
      )}
      {hasRefundableStake && (
        <Button variant="outline" className="w-full" onClick={() => handleAction('refund')} disabled={loading}>
          {loading ? 'Processing...' : 'Refund Stake'}
        </Button>
      )}
      {error && (
        <p className="text-[13px] text-[#EF4444] bg-[#EF4444]/[0.08] rounded-[12px] p-3">{error}</p>
      )}
    </div>
  )
}
