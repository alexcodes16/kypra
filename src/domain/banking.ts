import type {
  AccountId,
  Action,
  BankState,
  Category,
  SpendingCategory,
  Transaction,
  TransferDraft,
} from "./types.ts";
export const SPENDING_CATEGORIES: SpendingCategory[] = [
  "Housing",
  "Groceries",
  "Dining",
  "Transport",
  "Shopping",
  "Subscriptions",
  "Transfers",
];
const CATEGORIES: Category[] = [...SPENDING_CATEGORIES,"Income","Internal"];
// Money stays in integer minor units. Formatting is confined to the UI.
export function parseMoney(input: string): number | null {
  const normalized = input.trim().replace(",",".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole,fraction = ""] = normalized.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2,"0"));
  return result > 0 && Number.isSafeInteger(result) ? result : null;
}
// CY IBAN syntax + streaming mod-97. Demo IBANs use a fictional bank code.
export function validCyprusIban(input: string): boolean {
  const iban = input.replace(/\s/g,"").toUpperCase();
  if (!/^CY\d{26}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0,4);
  let remainder = 0;
  for (const char of rearranged) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of digits)
      remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}
export function balance(state: BankState,id: AccountId): number {
  const opening = state.accounts.find((a) => a.id === id)?.openingCents ?? 0;
  return state.transactions.reduce(
    (sum,tx) => sum + (tx.accountId === id ? tx.amountCents : 0),
    opening,
  );
}
export function totals(transactions: Transaction[],month: string) {
  return transactions
    .filter((tx) => tx.date.startsWith(month) && tx.category !== "Internal")
    .reduce(
      (acc,tx) =>
        tx.amountCents > 0
          ? { ...acc,income: acc.income + tx.amountCents }
          : { ...acc,spending: acc.spending - tx.amountCents },
      { income: 0,spending: 0 },
    );
}
export function isReportMonth(month: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return false;
  const year = Number(month.slice(0,4));
  return year >= 1900 && year <= 2100;
}
export interface CashFlowPoint {
  day: number;
  income: number;
  spending: number;
}
// Bucket once,then accumulate. Changing the month never changes account balances.
export function monthlyCashFlow(
  transactions: Transaction[],
  month: string,
): CashFlowPoint[] {
  if (!isReportMonth(month)) return [];
  const [year,monthNumber] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
  const points = Array.from({ length: days },(_,index) => ({
    day: index + 1,
    income: 0,
    spending: 0,
  }));
  for (const tx of transactions) {
    if (!tx.date.startsWith(`${month}-`) || tx.category === "Internal")
      continue;
    const point = points[Number(tx.date.slice(8,10)) - 1];
    if (!point) continue;
    if (tx.amountCents > 0) point.income += tx.amountCents;
    else point.spending -= tx.amountCents;
  }
  for (let index = 1; index < points.length; index++) {
    points[index].income += points[index - 1].income;
    points[index].spending += points[index - 1].spending;
  }
  return points;
}
export function spendingByCategory(
  transactions: Transaction[],
  month: string,
): Record<SpendingCategory,number> {
  const result = Object.fromEntries(
    SPENDING_CATEGORIES.map((c) => [c,0]),
  ) as Record<SpendingCategory,number>;
  for (const tx of transactions) {
    if (
      tx.date.startsWith(month) &&
      tx.amountCents < 0 &&
      SPENDING_CATEGORIES.includes(tx.category as SpendingCategory)
    )
      result[tx.category as SpendingCategory] -= tx.amountCents;
  }
  return result;
}
export type TransferErrors = Partial<
  Record<
    keyof TransferDraft,
    "nameError" | "ibanError" | "amountError" | "fundsError" | "referenceError"
  >
>;
export function validateTransfer(
  draft: TransferDraft,
  availableCents: number,
): TransferErrors {
  const errors: TransferErrors = {};
  if (draft.name.trim().length < 2 || draft.name.trim().length > 60)
    errors.name = "nameError";
  if (!validCyprusIban(draft.iban)) errors.iban = "ibanError";
  const amount = parseMoney(draft.amount);
  if (amount === null) errors.amount = "amountError";
  else if (amount > availableCents) errors.amount = "fundsError";
  if (draft.reference.trim().length > 100) errors.reference = "referenceError";
  return errors;
}
export function bankReducer(state: BankState,action: Action): BankState {
  if (action.type === "load") return action.state;
  if (action.type === "budget") {
    if (
      !SPENDING_CATEGORIES.includes(action.category) ||
      !Number.isSafeInteger(action.amountCents) ||
      action.amountCents <= 0
    )
      return state;
    return {
      ...state,
      budgets: { ...state.budgets,[action.category]: action.amountCents },
    };
  }
  if (action.type === "transfer") {
    const tx = action.transfer;
    if (
      state.transactions.some((t) => t.id === tx.id) ||
      !validCyprusIban(tx.iban) ||
      tx.name.trim().length < 2 ||
      tx.name.trim().length > 60 ||
      tx.reference.length > 100 ||
      !isDate(tx.date) ||
      !Number.isSafeInteger(tx.amountCents) ||
      tx.amountCents <= 0 ||
      tx.amountCents > balance(state,"everyday")
    )
      return state;
    return {
      ...state,
      transactions: [
        {
          id: tx.id,
          accountId: "everyday",
          name: tx.name.trim(),
          category: "Transfers",
          amountCents: -tx.amountCents,
          date: tx.date,
          reference: tx.reference.trim(),
        },
        ...state.transactions,
      ],
    };
  }
  if (action.type === "contribute") {
    const goal = state.goals.find((g) => g.id === action.goalId);
    const amount = action.amountCents;
    if (
      !goal ||
      state.transactions.some((tx) => tx.id === action.id) ||
      !isDate(action.date) ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > balance(state,"everyday") ||
      goal.savedCents + amount > goal.targetCents
    )
      return state;
    const debit: Transaction = {
      id: action.id,
      accountId: "everyday",
      name: "Savings contribution",
      category: "Internal",
      amountCents: -amount,
      date: action.date,
      reference: goal.name,
    };
    return {
      ...state,
      goals: state.goals.map((g) =>
        g.id === goal.id ? { ...g,savedCents: g.savedCents + amount } : g,
      ),
      transactions: [
        debit,
        {
          ...debit,
          id: `${action.id}-credit`,
          accountId: "savings",
          amountCents: amount,
        },
        ...state.transactions,
      ],
    };
  }
  return state;
}
export interface Filters {
  query: string;
  category: string;
  account: string;
  type: string;
  month: string;
  sort: "newest" | "oldest" | "largest";
}
export function filterTransactions(
  transactions: Transaction[],
  filters: Filters,
): Transaction[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return transactions
    .filter(
      (tx) =>
        (!query ||
          `${tx.name} ${tx.reference} ${tx.category}`
            .toLocaleLowerCase()
            .includes(query)) &&
        (!filters.category || tx.category === filters.category) &&
        (!filters.account || tx.accountId === filters.account) &&
        (!filters.month || tx.date.startsWith(filters.month)) &&
        (!filters.type ||
          (filters.type === "income"
            ? tx.amountCents > 0
            : tx.amountCents < 0)),
    )
    .toSorted((a,b) =>
      filters.sort === "largest"
        ? Math.abs(b.amountCents) - Math.abs(a.amountCents)
        : filters.sort === "oldest"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
    );
}
// Quoting alone does not prevent spreadsheet formula injection.
export function csvCell(value: string): string {
  const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"','""')}"`;
}
export function transactionsCsv(transactions: Transaction[]): string {
  const rows = transactions.map((tx) =>
    [
      csvCell(tx.date),
      csvCell(tx.name),
      csvCell(tx.category),
      (tx.amountCents / 100).toFixed(2),
      csvCell(tx.accountId),
      csvCell(tx.reference),
    ].join(","),
  );
  return ["Date,Merchant,Category,Amount EUR,Account,Reference",...rows].join(
    "\r\n",
  );
}
export function isDate(input: unknown): input is string {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input))
    return false;
  const date = new Date(`${input}T12:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === input
  );
}
const record = (value: unknown): value is Record<string,unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const cents = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Math.abs(value as number) <= 10_000_000_000;
export function isBankState(value: unknown): value is BankState {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.accounts) ||
    !Array.isArray(value.transactions) ||
    !Array.isArray(value.goals) ||
    !record(value.budgets)
  )
    return false;
  if (
    value.accounts.length !== 2 ||
    !["everyday","savings"].every(
      (id) =>
        (value.accounts as unknown[]).filter((a) => record(a) && a.id === id)
          .length === 1,
    )
  )
    return false;
  if (
    !value.accounts.every(
      (a) =>
        record(a) &&
        cents(a.openingCents) &&
        a.openingCents >= 0 &&
        typeof a.number === "string" &&
        a.number.length <= 60,
    )
  )
    return false;
  if (
    value.transactions.length > 10000 ||
    !value.transactions.every(
      (t) =>
        record(t) &&
        typeof t.id === "string" &&
        t.id.length > 0 &&
        ["everyday","savings"].includes(t.accountId as string) &&
        typeof t.name === "string" &&
        t.name.length <= 100 &&
        CATEGORIES.includes(t.category as Category) &&
        cents(t.amountCents) &&
        t.amountCents !== 0 &&
        isDate(t.date) &&
        typeof t.reference === "string" &&
        t.reference.length <= 100,
    )
  )
    return false;
  if (
    new Set(value.transactions.map((t) => t.id)).size !==
    value.transactions.length
  )
    return false;
  if (
    !SPENDING_CATEGORIES.every(
      (c) =>
        cents((value.budgets as Record<string,unknown>)[c]) &&
        Number((value.budgets as Record<string,unknown>)[c]) > 0,
    )
  )
    return false;
  if (
    value.goals.length !== 2 ||
    !["g1","g2"].every(
      (id) =>
        (value.goals as unknown[]).filter((g) => record(g) && g.id === id)
          .length === 1,
    )
  )
    return false;
  if (
    !value.goals.every(
      (g) =>
        record(g) &&
        ["summer","laptop"].includes(g.name as string) &&
        cents(g.targetCents) &&
        g.targetCents > 0 &&
        cents(g.savedCents) &&
        g.savedCents >= 0 &&
        g.savedCents <= g.targetCents,
    )
  )
    return false;
  const state = value as unknown as BankState;
  return (
    balance(state,"everyday") >= 0 &&
    balance(state,"savings") >=
      state.goals.reduce((sum,g) => sum + g.savedCents,0)
  );
}
