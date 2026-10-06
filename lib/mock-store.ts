export type TradeDirection = 'CALL' | 'PUT';

export type TradeRecord = {
  id: string;
  symbol: string;
  direction: TradeDirection;
  amount: number;
  price: number;
  commission: number;
  status: 'open' | 'closed';
  createdAt: string;
  broadcaster: string;
  followerCount: number;
};

export const followerAccounts = [
  { id: 'acct_01', name: 'Ava', balance: 12000, currency: 'USD' },
  { id: 'acct_02', name: 'Leo', balance: 9000, currency: 'USD' },
  { id: 'acct_03', name: 'Mina', balance: 15000, currency: 'USD' },
  { id: 'acct_04', name: 'Ike', balance: 11000, currency: 'USD' },
];

export const tradeStore: TradeRecord[] = [
  {
    id: 'trade_1001',
    symbol: 'EURUSD',
    direction: 'CALL',
    amount: 100,
    price: 1.0896,
    commission: 3,
    status: 'open',
    createdAt: new Date().toISOString(),
    broadcaster: 'You',
    followerCount: 4,
  },
  {
    id: 'trade_1002',
    symbol: 'USDJPY',
    direction: 'PUT',
    amount: 120,
    price: 156.24,
    commission: 3.6,
    status: 'open',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    broadcaster: 'You',
    followerCount: 4,
  },
];
