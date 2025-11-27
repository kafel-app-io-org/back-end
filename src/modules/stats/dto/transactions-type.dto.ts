export class TransactionsByTypeItemDto {
  type: string;   // "transfer", "withdraw"...
  count: number;
  amount: number;
  percentage: number;
}
