# Xen

**Arc-native social prediction market.** Verified X users create short-lived USDC range markets on the final performance of their own fresh tweets. GenLayer generates fair time-aware ranges and resolves disputed outcomes.

> "Xen turns fresh tweets into short-lived USDC-settled attention markets on Arc."

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14)                                          │
│  Landing · Dashboard · Profile · Create Market · Market Detail  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ fetch / wagmi
┌───────────────────────────▼─────────────────────────────────────┐
│  Backend (Next.js API Routes)                                   │
│  Auth (SIWE + X OAuth) · Tweets · Markets · GenLayer · Resolve  │
└───┬───────────────┬──────────────────┬───────────────────────────┘
    │               │                  │
    ▼               ▼                  ▼
  Prisma       X API v2          GenLayer / OpenAI
  PostgreSQL   public_metrics    Market Designer · Guard · Dispute

    │
    ▼
  Arc (EVM)
  XenFactory ─► XenMarket (per market)
  XenResolver   USDC settlement
```

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui |
| Wallet | wagmi v2 · viem · SIWE |
| X Auth | OAuth 2.0 PKCE · X API v2 |
| AI / GenLayer | GenLayer node (prod) · OpenAI (dev) · Mock (test) |
| Backend | Next.js API Routes · iron-session |
| Database | PostgreSQL · Prisma ORM |
| Contracts | Solidity 0.8.24 · Foundry · OpenZeppelin |
| Chain | Arc (EVM-compatible) · USDC settlement |

---

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

Fill in all required variables (see `.env.example` for documentation):
- `DATABASE_URL` – PostgreSQL connection string
- `SESSION_SECRET` – ≥32 char random string
- `X_CLIENT_ID` / `X_CLIENT_SECRET` – from X Developer Portal
- `NEXT_PUBLIC_ARC_*` – Arc network config from https://arc.net/docs
- `NEXT_PUBLIC_USDC_ADDRESS` – official USDC on Arc
- `NEXT_PUBLIC_XEN_FACTORY_ADDRESS` / `NEXT_PUBLIC_XEN_RESOLVER_ADDRESS` – after deploy
- `RESOLVER_PRIVATE_KEY` – backend resolver wallet private key
- `OPENAI_API_KEY` or `GENLAYER_NODE_URL` – AI backend for GenLayer

For local dev without X API or a real AI:
```env
GENLAYER_MOCK_MODE=true
```

### 3. Database setup
```bash
npm run db:generate
npm run db:push
```

### 4. Run dev server
```bash
npm run dev
```

---

## Contracts

### Build & test
```bash
cd contracts

# Install OpenZeppelin (first time)
forge install OpenZeppelin/openzeppelin-contracts

forge build
forge test -vvv
```

### Deploy to Arc testnet
```bash
# Set env vars in your shell:
export DEPLOYER_PRIVATE_KEY=0x...
export RESOLVER_KEY_ADDRESS=0x...
export TRUSTED_SIGNER_ADDRESS=0x...
export TREASURY_ADDRESS=0x...
export ARC_USDC_ADDRESS=0x...   # official USDC on Arc — see Arc docs
export ARC_RPC_URL=https://...  # Arc RPC — see Arc docs

npm run contracts:deploy:testnet
```

Copy the output addresses into `.env.local`:
```env
NEXT_PUBLIC_XEN_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_XEN_RESOLVER_ADDRESS=0x...
```

> **Note:** Do not invent Arc contract addresses. Get the official USDC address and RPC from https://arc.net/docs before deploying.

---

## Market lifecycle

```
Creator connects wallet + X
  → picks eligible tweet (≤3h old, after xConnectedAt)
  → selects metric + duration
  → POST /api/genlayer/design  → GenLayer generates ranges
  → POST /api/genlayer/guard   → Guard validates + backend signs MarketConfig (EIP-712)
  → frontend: approve USDC (0.5) → XenFactory.createMarket(config, ranges, sig)
  → XenMarket deployed on Arc

Traders browse /dashboard
  → select range → approve USDC → XenMarket.bet(rangeIndex, amount)

At expiry (cron every 5 min):
  → fetch X API public_metrics for tweet
  → determine winning range
  → XenResolver.resolveMarket(address, index, finalValue, evidenceHash)
  → on failure: GenLayer Dispute Resolver
  → on unresolvable: void market, full refunds

Winners: XenMarket.claim()
Voided:  XenMarket.refund()
```

---

## MVP rules enforced

| Rule | Where enforced |
|------|---------------|
| Tweet ≤3h old for market creation | x-api.ts `isTweetEligible` + backend guard |
| Only tweets after xConnectedAt | x-api.ts + DB |
| Max 10 markets/day per creator | XenFactory + guard API |
| Max 3 markets per tweet | XenFactory + guard API |
| Unique active market per tweet+metric+duration | DB unique check |
| Creator cannot bet | XenMarket.sol |
| Market max 48h | XenFactory.sol |
| Creation fee 0.5 USDC | XenFactory.sol |
| Ranges: sorted, non-overlapping, final open-ended | XenMarket.sol constructor |
| Pari-mutuel payout | XenMarket._calculatePayout |
| Protocol fee 1% (configurable) | XenMarket + XenFactory |
| Signed MarketConfig prevents bypass | EIP-712 + ECDSA |
| Voided markets → full refunds | XenMarket.refund |

---

## GenLayer integration

Three roles (all in `src/lib/genlayer.ts`):

| Role | When called | Output |
|------|------------|--------|
| **Market Designer** | Market creation flow | Ranges JSON |
| **Market Guard** | Before signing MarketConfig | Approve/reject |
| **Dispute Resolver** | X API fails or boundary ambiguity | Winning range or void |

**Routing:**
- `GENLAYER_NODE_URL` set → GenLayer node JSON-RPC
- `OPENAI_API_KEY` set → OpenAI gpt-4o-mini (dev)
- `GENLAYER_MOCK_MODE=true` → deterministic mock (never in production)

---

## Optional: USYC yield

USYC yield routing is implemented as an interface (`IYieldAdapter`) with a no-op default (`NoYieldAdapter`). To activate:

1. Set `ENABLE_USYC_YIELD=true`
2. Set `USYC_CONTRACT_ADDRESS` to the official USYC contract on Arc
3. Implement `USYCYieldAdapter.sol` using the `IYieldAdapter` interface
4. Wire it up in `XenMarket` constructor

Do **not** activate until official USYC contract address and redemption mechanics are available on Arc.

---

## Cron job

Market resolution runs via `/api/cron/resolve` every 5 minutes (configured in `vercel.json`).

For non-Vercel deployments, call this endpoint with `Authorization: Bearer $CRON_SECRET`.

---

## Security notes

- EIP-712 signed `MarketConfig` prevents users bypassing backend/GenLayer checks
- `RESOLVER_PRIVATE_KEY` is backend-only; never exposed to frontend
- X tokens encrypted at rest (AES-256-CBC via `src/lib/crypto.ts`)
- ReentrancyGuard on all USDC-moving functions
- SafeERC20 for all token transfers
- No raw X user data on-chain (hashed xUserId only)
