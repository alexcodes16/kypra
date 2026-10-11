import {
  balance,
  totals,
  spendingByCategory,
  filterTransactions,
} from "../domain/banking";
import type { PageProps } from "../context";
import { money,monthLabel } from "../i18n";
import { TransactionTable } from "./Transactions";
import CashFlowChart from "./CashFlowChart";

export default function Overview({
  state,
  locale,
  month,
  t,
  navigate,
  hidden,
  setHidden,
}: PageProps & {
  hidden: boolean;
  setHidden: (value: boolean) => void;
}) {
  const everyday = balance(state,"everyday");
  const savings = balance(state,"savings");
  const { income,spending } = totals(state.transactions,month);
  const categories = Object.entries(
    spendingByCategory(state.transactions,month),
  )
    .filter(([,amount]) => amount > 0)
    .toSorted((a,b) => b[1] - a[1]);
  const recent = filterTransactions(state.transactions,{
    query: "",
    category: "",
    account: "",
    type: "",
    month,
    sort: "newest",
  }).slice(0,5);
  const displayBalance = (cents: number) =>
    hidden ? "••••••" : money(cents,locale);

  return (
    <>
      <section className="balance-summary" aria-label={t("totalBalance")}>
        <div>
          <h2>{t("totalBalance")}</h2>
          <strong>{displayBalance(everyday + savings)}</strong>
        </div>
        <button
          className="text-button"
          aria-pressed={hidden}
          onClick={() => setHidden(!hidden)}
        >
          {t(hidden ? "showBalance" : "hideBalance")}
        </button>
      </section>
      <p className="balance-note">{t("balancesScope")}</p>
      <div className="account-grid">
        {state.accounts.map((account) => (
          <section className="panel account-panel" key={account.id}>
            <div>
              <h2>{t(account.id)}</h2>
              <span className="muted">{account.number}</span>
            </div>
            <strong>
              {displayBalance(account.id === "everyday" ? everyday : savings)}
            </strong>
          </section>
        ))}
      </div>

      <section className="monthly-summary" aria-label={t("monthlyTotals")}>
        <div>
          <span>{t("income")}</span>
          <strong>{money(income,locale)}</strong>
        </div>
        <div>
          <span>{t("spending")}</span>
          <strong>{money(spending,locale)}</strong>
        </div>
        <div>
          <span>{t("net")}</span>
          <strong className={income < spending ? "warning-text" : ""}>
            {money(income - spending,locale)}
          </strong>
        </div>
      </section>

      <div className="report-grid">
        <section className="panel chart-panel">
          <div className="section-heading">
            <h2>{t("cashflow")}</h2>
            <span>{monthLabel(month,locale)}</span>
          </div>
          <p className="section-intro">{t("cumulative")}</p>
          <CashFlowChart
            transactions={state.transactions}
            month={month}
            locale={locale}
            t={t}
          />
        </section>
        <section className="panel category-panel">
          <h2>{t("spendingCategories")}</h2>
          {categories.length ? (
            <ul className="category-list">
              {categories.map(([category,amount]) => (
                <li key={category}>
                  <div>
                    <span>{t(category as keyof typeof state.budgets)}</span>
                    <strong>{money(amount,locale)}</strong>
                  </div>
                  <div className="category-bar" aria-hidden="true">
                    <span style={{ width: `${(amount / spending) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">{t("noMonthActivity")}</p>
          )}
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="section-heading">
          <h2>{t("recent")}</h2>
          <button
            className="text-button"
            onClick={() => navigate("transactions")}
          >
            {t("viewAll")}
          </button>
        </div>
        {recent.length ? (
          <TransactionTable transactions={recent} locale={locale} t={t} />
        ) : (
          <p className="empty-message">{t("noMonthActivity")}</p>
        )}
      </section>
    </>
  );
}
