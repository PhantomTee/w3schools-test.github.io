'use client'
import { useState } from 'react'
import { useWriteContract } from 'wagmi'
import { Button } from '@/components/ui/button'
import { XEN_MARKET_ABI } from '@/config/abi'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  contractAddress: string
  state:           string
  winningRangeIndex: number | null
  userStakes:      Array<{ rangeIndex: number; amount: string; claimed: boolean }>
}

export function ClaimRefundButton({ contractAddress, state, winningRangeIndex, userStakes }: Props) {
  const { writeContractAsync } = useWriteContract()
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const hasWinningStake = state === 'RESOLVED' && winningRangeIndex != null &&
    userStakes.some(s => s.rangeIndex === winningRangeIndex && !s.claimed && BigInt(s.amount) > 0n)

  const hasRefundableStake = (state === 'VOIDED' || state === 'CANCELLED') &&
    userStakes.some(s => BigInt(s.amount) > 0n)

  const canClaim  = hasWinningStake
  const canRefund = hasRefundableStake

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
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <CheckCircle2 className="h-4 w-4" /> Success!
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {canClaim && (
        <Button variant="xen" onClick={() => handleAction('claim')} disabled={loading} className="w-full">
          {loading ? 'Claiming…' : 'Claim Winnings'}
        </Button>
      )}
      {canRefund && (
        <Button variant="outline" onClick={() => handleAction('refund')} disabled={loading} className="w-full">
          {loading ? 'Refunding…' : 'Refund Stake'}
        </Button>
      )}
      {error && (
        <div className="flex items-start gap-2 text-destructive text-xs">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
