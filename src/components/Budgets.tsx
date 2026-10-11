import { useState,type FormEvent } from "react";
import {
  parseMoney,
  SPENDING_CATEGORIES,
  spendingByCategory,
} from "../domain/banking";
import type { SpendingCategory } from "../domain/types";
import type { PageProps } from "../context";
import { money,monthLabel } from "../i18n";
import { Dialog,Progress } from "./shared";

export default function Budgets({
  state,
  dispatch,
  t,
  locale,
  month,
  notify,
}: PageProps) {
  const [editing,setEditing] = useState<SpendingCategory | null>(null);
  const [amount,setAmount] = useState("");
  const [error,setError] = useState(false);
  const spending = spendingByCategory(state.transactions,month);
  const planned = Object.values(state.budgets).reduce((a,b) => a+b,0);
  const spent = Object.values(spending).reduce((a,b) => a+b,0);

  function save(e: FormEvent) {
    e.preventDefault();
    const cents =parseMoney(amount);
    if (cents === null || !editing) {
      setError(true);
      document.getElementById("budget-amount")?.focus();
      return;
    }
    dispatch({ type: "budget",category: editing,amountCents: cents });
    setEditing(null);
    notify(t("budgetSaved"));
  }

  return (
    <>
      <div className="monthly-summary budget-summary">
        <div>
          <span>{t("totalPlan")}</span>
          <strong>{money(planned,locale)}</strong>
        </div>
        <div>
          <span>{t("spentSoFar")}</span>
          <strong>{money(spent,locale)}</strong>
        </div>
        <div>
          <span>{t(spent > planned ? "budgetOver" : "budgetLeft")}</span>
          <strong className={spent > planned ? "warning-text" : ""}>
            {money(Math.abs(planned - spent),locale)}
          </strong>
        </div>
      </div>
      <section className="panel budget-panel">
        <div className="section-heading">
          <h2>{t("monthlyBudget")}</h2>
          <span>{monthLabel(month,locale)}</span>
        </div>
        <div className="table-wrap">
          <table className="budget-table">
            <caption className="sr-only">
              {t("monthlyBudget")} — {monthLabel(month,locale)}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("category")}</th>
                <th scope="col" className="number">
                  {t("budgetLimit")}
                </th>
                <th scope="col" className="number">
                  {t("spentSoFar")}
                </th>
                <th scope="col">{t("budgetLeft")}</th>
                <th scope="col">
                  <span className="sr-only">{t("editBudget")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {SPENDING_CATEGORIES.map((category) => {
                const used = spending[category],
                  limit=state.budgets[category],
                  over=used>limit;
                return (
                  <tr key={category}>
                    <th scope="row">{t(category)}</th>
                    <td className="number">{money(limit,locale)}</td>
                    <td className="number">{money(used,locale)}</td>
                    <td className="budget-remaining">
                      <span className={over ? "warning-text" : ""}>
                        {over && `${t("budgetOver")}: `}
                        {money(Math.abs(limit-used),locale)}
                      </span>
                      <Progress
                        value={(used/limit)*100}
                        label={t(category)}
                        color={over ? "#b42318" : undefined}
                      />
                    </td>
                    <td>
                      <button
                        className="text-button"
                        aria-label={`${t("editBudget")}: ${t(category)}`}
                        onClick={() => {
                          setEditing(category);
                          setAmount((limit/100).toFixed(2));
                          setError(false);
                        }}
                      >
                        {t("edit")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="notice">{t("budgetExplanation")}</p>
      {editing && (
        <Dialog
          title={`${t("editBudget")} · ${t(editing)}`}
          closeLabel={t("close")}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save} noValidate>
            <label className="form-field" htmlFor="budget-amount">
              {t("monthlyLimit")}
              <input
                id="budget-amount"
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(false);
                }}
                aria-invalid={error}
                aria-describedby={error ? "budget-error" : undefined}
              />
            </label>
            {error && (
              <p className="field-error" id="budget-error" role="alert">
                {t("budgetError")}
              </p>
            )}
            <div className="form-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setEditing(null)}
              >
                {t("cancel")}
              </button>
              <button className="button primary" type="submit">
                {t("save")}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
