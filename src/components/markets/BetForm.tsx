'use client'
import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatUSDC, formatCount } from '@/lib/utils'
import { CONTRACT_ADDRESSES, USDC_DECIMALS } from '@/config/contracts'
import { ERC20_ABI, XEN_MARKET_ABI } from '@/config/abi'
import type { Range } from '@/types/market'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Pool { rangeIndex: number; amount: string }

interface Props {
  marketId:       string
  contractAddress: string
  creator:        string
  ranges:         Range[]
  pools:          Pool[]
  totalStaked:    string
  state:          string
  expiresAt:      string
}

export function BetForm({ marketId, contractAddress, creator, ranges, pools, totalStaked, state, expiresAt }: Props) {
  const { address } = useAccount()
  const [selectedRange, setSelectedRange] = useState<number | null>(null)
  const [amount, setAmount]               = useState('')
  const [step, setStep]                   = useState<'idle' | 'approve' | 'bet' | 'recording' | 'done'>('idle')
  const [error, setError]                 = useState<string | null>(null)

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

  const expired = new Date() >= new Date(expiresAt)
  const isCreator = address?.toLowerCase() === creator.toLowerCase()
  const canBet = state === 'OPEN' && !expired && !isCreator && !!address

  async function handleBet() {
    if (selectedRange === null || !address || !amountRaw) return
    setError(null)

    try {
      // Approve USDC if needed
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

      // Record in DB
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
      <div className="flex items-center gap-2 text-emerald-400 py-4">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm">Bet placed successfully!</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Range selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Pick a range</Label>
        {ranges.map((r, i) => {
          const pool  = BigInt(pools.find(p => p.rangeIndex === i)?.amount ?? '0')
          const pct   = totalPool > 0n ? Number((pool * 100n) / totalPool) : 0
          const poolDisplay = parseFloat(pool.toString()) / 1e6

          return (
            <button
              key={i}
              onClick={() => canBet && setSelectedRange(i)}
              disabled={!canBet}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedRange === i
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border hover:border-border/80 hover:bg-accent/30'
              } ${!canBet ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{r.label}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{poolDisplay.toFixed(2)} USDC</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {pct}% of pool
                  </Badge>
                </div>
              </div>
              <Progress value={pct} className="h-1" />
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>Difficulty: {'★'.repeat(Math.ceil(r.difficulty / 2))}</span>
                <span>{pct > 0 ? `~${(100 / (pct / 100)).toFixed(1)}x implied` : '—'}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Amount input */}
      {selectedRange !== null && canBet && (
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-xs text-muted-foreground uppercase tracking-wide">
            Amount (USDC)
          </Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-1">
              {[1, 5, 10].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="px-2 py-1 rounded border border-border text-xs hover:bg-accent"
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>
          {usdcBalance !== undefined && (
            <p className="text-xs text-muted-foreground">
              Balance: {(Number(usdcBalance) / 1e6).toFixed(2)} USDC
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Disabled reason */}
      {!canBet && (
        <p className="text-xs text-muted-foreground text-center">
          {!address       ? 'Connect wallet to bet' :
           isCreator      ? 'Creator cannot bet on own market' :
           expired        ? 'Market expired' :
           state !== 'OPEN' ? `Market is ${state}` : ''}
        </p>
      )}

      {/* Submit */}
      {canBet && (
        <Button
          variant="xen"
          className="w-full"
          onClick={handleBet}
          disabled={selectedRange === null || !amount || parseFloat(amount) <= 0 || step !== 'idle'}
        >
          {step === 'approve'    ? 'Approving USDC…' :
           step === 'bet'        ? 'Confirming bet…' :
           step === 'recording'  ? 'Recording…' :
           selectedRange === null ? 'Select a range' :
           `Stake ${amount || '0'} USDC on ${ranges[selectedRange]?.label}`}
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Pari-mutuel pool. Payout = your share of the losing pool minus 1% protocol fee.
      </p>
    </div>
  )
}
