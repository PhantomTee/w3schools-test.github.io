/**
 * Contract addresses — sourced from environment variables set after deployment.
 * See contracts/script/Deploy.s.sol for deployment instructions.
 * See .env.example for the required variable names.
 */
export const CONTRACT_ADDRESSES = {
  USDC:        (process.env.NEXT_PUBLIC_USDC_ADDRESS        ?? '') as `0x${string}`,
  XEN_FACTORY: (process.env.NEXT_PUBLIC_XEN_FACTORY_ADDRESS ?? '') as `0x${string}`,
  XEN_RESOLVER:(process.env.NEXT_PUBLIC_XEN_RESOLVER_ADDRESS ?? '') as `0x${string}`,
} as const

export const USDC_DECIMALS = 6
export const CREATION_FEE_RAW = BigInt(500_000) // 0.5 USDC
