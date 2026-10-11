export type AccountId = "everyday" | "savings";
export type Category =
  | "Housing"
  | "Groceries"
  | "Dining"
  | "Transport"
  | "Shopping"
  | "Subscriptions"
  | "Income"
  | "Transfers"
  | "Internal";
export type SpendingCategory = Exclude<Category,"Income" | "Internal">;
export type Locale = "en" | "el";
export type Page =
  | "overview"
  | "transactions"
  | "transfers"
  | "budgets"
  | "goals"
  | "settings";
export interface Transaction {
  id: string;
  accountId: AccountId;
  name: string;
  category: Category;
  amountCents: number;
  date: string;
  reference: string;
}
export interface Account {
  id: AccountId;
  openingCents: number;
  number: string;
}
export interface Goal {
  id: string;
  name: "summer" | "laptop";
  targetCents: number;
  savedCents: number;
}
export interface BankState {
  version: 1;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Record<SpendingCategory,number>;
  goals: Goal[];
}
export interface TransferDraft {
  name: string;
  iban: string;
  amount: string;
  reference: string;
}
export interface ConfirmedTransfer {
  id: string;
  name: string;
  iban: string;
  amountCents: number;
  reference: string;
  date: string;
}
export type Action =
  | { type: "load"; state: BankState }
  | { type: "transfer"; transfer: ConfirmedTransfer }
  | {
      type: "contribute";
      goalId: string;
      amountCents: number;
      id: string;
      date: string;
    }
  | { type: "budget"; category: SpendingCategory; amountCents: number };
