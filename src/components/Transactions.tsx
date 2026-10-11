import { useMemo,useState } from "react";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpRight,
} from "lucide-react";
import {
  filterTransactions,
  SPENDING_CATEGORIES,
  transactionsCsv,
  type Filters,
} from "../domain/banking";
import { dateLabel,money } from "../i18n";
import type { Category,Locale,Transaction } from "../domain/types";
import type { PageProps } from "../context";
import type { Translate } from "../i18n";
import { Dialog,EmptyState } from "./shared";

export function TransactionTable({
  transactions,
  locale,
  t,
}: {
  transactions: Transaction[];
  locale: Locale;
  t: Translate;
}) {
  const [selected,setSelected] = useState<Transaction | null>(null);
  return (
    <>
      <div className="table-wrap">
        <table className="transaction-table">
          <caption className="sr-only">{t("transactions")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("merchant")}</th>
              <th scope="col">{t("date")}</th>
              <th scope="col" className="category-col">
                {t("category")}
              </th>
              <th scope="col" className="number">
                {t("amount")}
              </th>
              <th scope="col">
                <span className="sr-only">{t("details")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>
                  <div className="merchant">
                    <div>
                      <button
                        className="merchant-name"
                        onClick={() => setSelected(tx)}
                      >
                        {tx.name}
                      </button>
                      <span className="merchant-sub">
                        {tx.reference === "summer" || tx.reference === "laptop"
                          ? t(tx.reference)
                          : tx.reference || t(tx.category)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="date-cell">
                  <time dateTime={tx.date}>{dateLabel(tx.date,locale)}</time>
                </td>
                <td className="category-col">
                  <span className="category-tag">{t(tx.category)}</span>
                </td>
                <td
                  className={`number tx-amount ${tx.amountCents > 0 ? "positive" : ""}`}
                >
                  {tx.amountCents > 0 ? "+" : "−"}
                  {money(Math.abs(tx.amountCents),locale)}
                </td>
                <td>
                  <button
                    className="icon-button small"
                    aria-label={`${t("details")}: ${tx.name}`}
                    onClick={() => setSelected(tx)}
                  >
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <Dialog
          title={t("details")}
          closeLabel={t("close")}
          onClose={() => setSelected(null)}
        >
          <div className="transaction-detail-top">
            <h3>{selected.name}</h3>
            <strong className={selected.amountCents > 0 ? "positive" : ""}>
              {selected.amountCents > 0 ? "+" : "−"}
              {money(Math.abs(selected.amountCents),locale)}
            </strong>
          </div>
          <dl className="detail-list">
            <div>
              <dt>{t("status")}</dt>
              <dd>
                <span className="status-tag">{t("completed")}</span>
              </dd>
            </div>
            <div>
              <dt>{t("date")}</dt>
              <dd>{dateLabel(selected.date,locale)}</dd>
            </div>
            <div>
              <dt>{t("category")}</dt>
              <dd>{t(selected.category)}</dd>
            </div>
            <div>
              <dt>{t("account")}</dt>
              <dd>{t(selected.accountId)}</dd>
            </div>
            <div>
              <dt>{t("reference")}</dt>
              <dd>
                {["summer","laptop"].includes(selected.reference)
                  ? t(selected.reference as "summer" | "laptop")
                  : selected.reference || "—"}
              </dd>
            </div>
            <div>
              <dt>{t("transferId")}</dt>
              <dd className="mono">{selected.id}</dd>
            </div>
          </dl>
          {selected.category === "Internal" && (
            <p className="notice">{t("internalNote")}</p>
          )}
        </Dialog>
      )}
    </>
  );
}

const DEFAULT_FILTERS: Filters = {
  query: "",
  category: "",
  account: "",
  type: "",
  month: "",
  sort: "newest",
};
const PAGE_SIZE = 8;
export default function Transactions({ state,locale,t,notify }: PageProps) {
  const [filters,setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page,setPage] = useState(1);
  const filtered = useMemo(
    () => filterTransactions(state.transactions,filters),
    [state.transactions,filters],
  );
  const pages = Math.max(1,Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page,pages);
  const update = (key: keyof Filters,value: string) => {
    setFilters((f) => ({ ...f,[key]: value }));
    setPage(1);
  };
  const clear = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };
  const months = [
    ...new Set(state.transactions.map((tx) => tx.date.slice(0,7))),
  ]
    .toSorted()
    .reverse();
  function exportCsv() {
    const blob = new Blob(["\uFEFF",transactionsCsv(filtered)],{
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kypra-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify(t("exported"));
  }
  return (
    <section className="panel transactions-panel">
      <div className="transactions-toolbar">
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <label htmlFor="transaction-search" className="sr-only">
            {t("search")}
          </label>
          <input
            id="transaction-search"
            type="search"
            value={filters.query}
            onChange={(e) => update("query",e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <button
          className="button secondary"
          onClick={exportCsv}
          disabled={!filtered.length}
        >
          <ArrowDownToLine size={17} aria-hidden="true" />
          {t("export")}
        </button>
      </div>
      <div className="filter-grid">
        <label>
          {t("category")}
          <select
            value={filters.category}
            onChange={(e) => update("category",e.target.value)}
          >
            <option value="">{t("allCategories")}</option>
            {[...SPENDING_CATEGORIES,"Income","Internal"].map((c) => (
              <option key={c} value={c}>
                {t(c as Category)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("account")}
          <select
            value={filters.account}
            onChange={(e) => update("account",e.target.value)}
          >
            <option value="">{t("allAccounts")}</option>
            <option value="everyday">{t("everyday")}</option>
            <option value="savings">{t("savings")}</option>
          </select>
        </label>
        <label>
          {t("direction")}
          <select
            value={filters.type}
            onChange={(e) => update("type",e.target.value)}
          >
            <option value="">{t("allTypes")}</option>
            <option value="income">{t("incoming")}</option>
            <option value="expense">{t("outgoing")}</option>
          </select>
        </label>
        <label>
          {t("period")}
          <select
            value={filters.month}
            onChange={(e) => update("month",e.target.value)}
          >
            <option value="">{t("allMonths")}</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {new Intl.DateTimeFormat(locale === "el" ? "el-CY" : "en-GB",{
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${m}-01T12:00:00Z`))}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("sort")}
          <select
            value={filters.sort}
            onChange={(e) => update("sort",e.target.value)}
          >
            <option value="newest">{t("newest")}</option>
            <option value="oldest">{t("oldest")}</option>
            <option value="largest">{t("largest")}</option>
          </select>
        </label>
      </div>
      <div className="results-line">
        <p role="status">
          {filtered.length} {t("results")}
        </p>
        <button className="text-button" onClick={clear}>
          {t("clearFilters")}
        </button>
      </div>
      {filtered.length ? (
        <TransactionTable
          transactions={filtered.slice(
            (currentPage - 1) * PAGE_SIZE,
            currentPage * PAGE_SIZE,
          )}
          locale={locale}
          t={t}
        />
      ) : (
        <EmptyState title={t("noResults")} text={t("noResultsText")}>
          <button className="button secondary" onClick={clear}>
            {t("clearFilters")}
          </button>
        </EmptyState>
      )}
      <div className="pagination">
        <span>
          {t("page")} {currentPage} {t("of")} {pages}
        </span>
        <div>
          <button
            className="button secondary small"
            aria-label={t("previous")}
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
            {t("previous")}
          </button>
          <button
            className="button secondary small"
            aria-label={t("next")}
            disabled={currentPage === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            {t("next")}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
