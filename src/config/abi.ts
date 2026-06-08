export const ERC20_ABI = [
  { name: 'balanceOf',   type: 'function', stateMutability: 'view',       inputs: [{ name: 'account', type: 'address' }],                                    outputs: [{ type: 'uint256' }] },
  { name: 'allowance',   type: 'function', stateMutability: 'view',       inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve',     type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'decimals',    type: 'function', stateMutability: 'view',       inputs: [],                                                                         outputs: [{ type: 'uint8' }] },
  { name: 'transfer',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],     outputs: [{ type: 'bool' }] },
] as const

export const XEN_FACTORY_ABI = [
  {
    name: 'createMarket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'config',
        type: 'tuple',
        components: [
          { name: 'creator',              type: 'address' },
          { name: 'xUserIdHash',          type: 'bytes32' },
          { name: 'tweetId',              type: 'string'  },
          { name: 'metricType',           type: 'uint8'   },
          { name: 'startValue',           type: 'uint256' },
          { name: 'createdAt',            type: 'uint256' },
          { name: 'marketStartTime',      type: 'uint256' },
          { name: 'marketEndTime',        type: 'uint256' },
          { name: 'rangesHash',           type: 'bytes32' },
          { name: 'marketQuestionHash',   type: 'bytes32' },
          { name: 'genLayerReportHash',   type: 'bytes32' },
          { name: 'nonce',                type: 'uint256' },
        ],
      },
      {
        name: 'ranges',
        type: 'tuple[]',
        components: [
          { name: 'min',        type: 'uint256' },
          { name: 'max',        type: 'uint256' },
          { name: 'maxOpen',    type: 'bool'    },
          { name: 'label',      type: 'string'  },
          { name: 'difficulty', type: 'uint8'   },
        ],
      },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [
      { name: 'marketId',      type: 'uint256' },
      { name: 'marketAddress', type: 'address' },
    ],
  },
  {
    name: 'creationFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'creatorDailyCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getMarket',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'marketId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'marketAddress', type: 'address' },
          { name: 'creator',       type: 'address' },
          { name: 'tweetId',       type: 'string'  },
          { name: 'createdAt',     type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'marketCount',
    type: 'function',
    stateMutability: 'view',
    inputs:  [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'MarketCreated',
    type: 'event',
    inputs: [
      { name: 'marketId',      type: 'uint256', indexed: true  },
      { name: 'marketAddress', type: 'address', indexed: true  },
      { name: 'creator',       type: 'address', indexed: true  },
      { name: 'tweetId',       type: 'string',  indexed: false },
      { name: 'metricType',    type: 'uint8',   indexed: false },
      { name: 'marketEndTime', type: 'uint256', indexed: false },
    ],
  },
] as const

export const XEN_MARKET_ABI = [
  {
    name: 'bet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'rangeIndex', type: 'uint8' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs:  [],
    outputs: [],
  },
  {
    name: 'refund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs:  [],
    outputs: [],
  },
  {
    name: 'getRange',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'index', type: 'uint8' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'min',        type: 'uint256' },
          { name: 'max',        type: 'uint256' },
          { name: 'maxOpen',    type: 'bool'    },
          { name: 'label',      type: 'string'  },
          { name: 'difficulty', type: 'uint8'   },
        ],
      },
    ],
  },
  {
    name: 'getAllRanges',
    type: 'function',
    stateMutability: 'view',
    inputs:  [],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'min',        type: 'uint256' },
          { name: 'max',        type: 'uint256' },
          { name: 'maxOpen',    type: 'bool'    },
          { name: 'label',      type: 'string'  },
          { name: 'difficulty', type: 'uint8'   },
        ],
      },
    ],
  },
  { name: 'rangePool',           type: 'function', stateMutability: 'view', inputs: [{ name: 'rangeIndex', type: 'uint8' }],                                            outputs: [{ type: 'uint256' }] },
  { name: 'getUserStake',        type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }, { name: 'rangeIndex', type: 'uint8' }],         outputs: [{ type: 'uint256' }] },
  { name: 'rangeCount',          type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'uint8'   }] },
  { name: 'creator',             type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'address' }] },
  { name: 'tweetId',             type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'string'  }] },
  { name: 'metricType',          type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'uint8'   }] },
  { name: 'startValue',          type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'uint256' }] },
  { name: 'marketEndTime',       type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'uint256' }] },
  { name: 'state',               type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'uint8'   }] },
  { name: 'finalValue',          type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'uint256' }] },
  { name: 'winningRangeIndex',   type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'uint8'   }] },
  { name: 'totalPool',           type: 'function', stateMutability: 'view', inputs: [],                                                                                 outputs: [{ type: 'uint256' }] },
  {
    name: 'BetPlaced',
    type: 'event',
    inputs: [{ name: 'user', type: 'address', indexed: true }, { name: 'rangeIndex', type: 'uint8', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }],
  },
  {
    name: 'MarketResolved',
    type: 'event',
    inputs: [{ name: 'winningRangeIndex', type: 'uint8', indexed: true }, { name: 'finalValue', type: 'uint256', indexed: false }, { name: 'evidenceHash', type: 'bytes32', indexed: false }],
  },
  {
    name: 'MarketVoided',
    type: 'event',
    inputs: [{ name: 'reasonHash', type: 'bytes32', indexed: false }],
  },
  {
    name: 'Claimed',
    type: 'event',
    inputs: [{ name: 'user', type: 'address', indexed: true }, { name: 'payout', type: 'uint256', indexed: false }],
  },
  {
    name: 'Refunded',
    type: 'event',
    inputs: [{ name: 'user', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }],
  },
] as const
