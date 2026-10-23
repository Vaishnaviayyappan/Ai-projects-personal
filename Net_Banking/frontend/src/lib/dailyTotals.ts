import { Transaction } from '../api';

// Approximation: buckets whatever falls within the last-10-transactions
// window the API already returns (GET /api/transactions has no separate
// endpoint for longer history), attributing debits to the primary account.
export function computeLast7DayDebitTotals(transactions: Transaction[], account: string): number[] {
  const days: number[] = new Array(7).fill(0);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const txn of transactions) {
    if (txn.from_account !== account) continue;
    const txnDate = new Date(txn.created_at);
    const txnMidnight = new Date(txnDate.getFullYear(), txnDate.getMonth(), txnDate.getDate());
    const dayDiff = Math.round((todayMidnight.getTime() - txnMidnight.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff >= 0 && dayDiff < 7) {
      const bucketIndex = 6 - dayDiff;
      days[bucketIndex] += txn.amount;
    }
  }

  return days;
}
