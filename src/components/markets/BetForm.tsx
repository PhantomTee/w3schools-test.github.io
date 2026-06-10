'use client'
import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CONTRACT_ADDRESSES } from '@/config/contracts'
import { ERC20_ABI, XEN_MARKET_ABI } from '@/config/abi'
import type { Range } from '@/types/market'

interface Pool { rangeIndex: number; amount: string }

interface Props {
  marketId:        string
  contractAddress: string
  creator:         string
  ranges:          Range[]
  pools:           Pool[]
  totalStaked:     string
  state:           string
  expiresAt:       string
}

export function BetForm({ marketId, contractAddress, creator, ranges, pools, totalStaked, state, expiresAt }: Props) {
  const { address }           = useAccount()
  const [selectedRange, setSelectedRange] = useState<number | null>(null)
  const [amount, setAmount]   = useState('')
  const [step, setStep]       = useState<'idle' | 'approve' | 'bet' | 'recording' | 'done'>('idle')
  const [error, setError]     = useState<string | null>(null)

  const { writeContractAsync } = useWriteContract()
  const amountRaw = amount ? BigInt(Math.round(parseFloat(amount) * 1e6)) : 0n

  const { data: allowance } = useReadContract({
    address:      CONTRACT_ADDRESSES.USDC,
    abi:          ERC20_ABI,
    functionName: 'allowance',
    args:         address ? [address, contractAddress as `0x${string}`] : undefined,
    query:        { enabled: !!address },
  })

  const { data: usdcBalance } = useReadContract({
    address:      CONTRACT_ADDRESSES.USDC,
    abi:          ERC20_ABI,
    functionName: 'balanceOf',
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  })

  const totalPool = BigInt(totalStaked)
  const expired   = new Date() >= new Date(expiresAt)
  const isCreator = address?.toLowerCase() === creator.toLowerCase()
  const canBet    = state === 'OPEN' && !expired && !isCreator && !!address

  async function handleBet() {
    if (selectedRange === null || !address || !amountRaw) return
    setError(null)
    try {
      if ((allowance ?? 0n) < amountRaw) {
        setStep('approve')
        await writeContractAsync({
          address:      CONTRACT_ADDRESSES.USDC,
          abi:          ERC20_ABI,
          functionName: 'approve',
          args:         [contractAddress as `0x${string}`, amountRaw],
        })
      }
      setStep('bet')
      const txHash = await writeContractAsync({
        address:      contractAddress as `0x${string}`,
        abi:          XEN_MARKET_ABI,
        functionName: 'bet',
        args:         [selectedRange, amountRaw],
      })
      setStep('recording')
      await fetch(`/api/markets/${marketId}/bet`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rangeIndex: selectedRange, amount: amountRaw.toString(), txHash }),
      })
      setStep('done')
    } catch (e) {
      setError((e as Error).message.slice(0, 200))
      setStep('idle')
    }
  }

  if (step === 'done') {
    return (
      <div className="py-6 text-center space-y-1">
        <p className="text-[var(--ink)] font-semibold">Prediction placed</p>
        <p className="text-[13px] text-[#64748B]">Your stake has been confirmed on Arc.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[11px] text-[#64748B] uppercase tracking-wider">Select prediction range</Label>
        {ranges.map((r, i) => {
          const pool        = BigInt(pools.find(p => p.rangeIndex === i)?.amount ?? '0')
          const pct         = totalPool > 0n ? Number((pool * 100n) / totalPool) : 0
          const poolDisplay = (parseFloat(pool.toString()) / 1e6).toFixed(2)
          const isSelected  = selectedRange === i
          const impliedPct  = totalPool > 0n ? pct : 0

          return (
            <button
              key={i}
              onClick={() => canBet && setSelectedRange(i)}
              disabled={!canBet}
              className={`w-full text-left p-4 rounded-[16px] border transition-all duration-150 ${
                isSelected
                  ? 'border-[var(--ink)] bg-[var(--bg-elevated)] [box-shadow:2px_2px_0_var(--ink)]'
                  : 'border-white/[0.06] bg-[var(--bg-elevated)] hover:border-white/[0.10] hover:bg-white/[0.02]'
              } ${!canBet ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">{r.label}</span>
                <div className="text-right">
                  <span className="text-[13px] text-[var(--text-muted)]">{poolDisplay} USDC</span>
                  {impliedPct > 0 && (
                    <span className="text-[12px] text-[var(--ink)] ml-2">
                      ~{(100 / (impliedPct / 100)).toFixed(1)}x
                    </span>
                  )}
                </div>
              </div>
              <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${isSelected ? 'bg-[var(--ink)]' : 'bg-[var(--text-muted)]'}`}
                  style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {selectedRange !== null && canBet && (
        <div className="space-y-2">
          <Label htmlFor="bet-amount" className="text-[11px] text-[#64748B] uppercase tracking-wider">
            Stake amount (USDC)
          </Label>
          <div className="flex gap-2">
            <Input
              id="bet-amount"
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-[var(--bg-elevated)] border-[var(--border-soft)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-[12px] focus:border-[var(--ink)]"
            />
            <div className="flex gap-1">
              {[5, 10, 25].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="px-3 py-1 rounded-[10px] border border-[var(--border-soft)] text-[12px] text-[var(--text-muted)] hover:bg-white/[0.04] hover:border-white/[0.12] transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          {usdcBalance !== undefined && (
            <p className="text-[12px] text-[#64748B]">
              Balance: {(Number(usdcBalance) / 1e6).toFixed(2)} USDC
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[#EF4444] bg-[#EF4444]/[0.08] rounded-[12px] p-3">{error}</p>
      )}

      {!canBet && (
        <p className="text-[13px] text-[#64748B] text-center py-2">
          {!address         ? 'Connect your wallet to place a prediction' :
           isCreator        ? 'Creator cannot place predictions on their own market' :
           expired          ? 'Market has expired' :
           state !== 'OPEN' ? `Market is ${state.toLowerCase()}` : ''}
        </p>
      )}

      {canBet && (
        <Button
          variant="xen"
          size="lg"
          className="w-full"
          onClick={handleBet}
          disabled={selectedRange === null || !amount || parseFloat(amount) <= 0 || step !== 'idle'}
        >
          {step === 'approve'    ? 'Approving USDC...' :
           step === 'bet'        ? 'Confirming on Arc...' :
           step === 'recording'  ? 'Recording...' :
           selectedRange === null ? 'Select a range first' :
           `Place Prediction — ${amount || '0'} USDC on ${ranges[selectedRange]?.label}`}
        </Button>
      )}

      <div className="space-y-1 pt-1">
        <p className="text-[12px] text-[#64748B] text-center">
          Payouts are pool-based and may change before confirmation.
        </p>
        <p className="text-[12px] text-[#64748B] text-center">
          Markets resolve from X API first. GenLayer handles fallback disputes.
        </p>
      </div>
    </div>
  )
}
