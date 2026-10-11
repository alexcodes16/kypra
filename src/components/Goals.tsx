import { useState,type FormEvent } from "react";
import { balance,parseMoney } from "../domain/banking";
import type { Goal } from "../domain/types";
import type { PageProps } from "../context";
import { cyprusToday,money } from "../i18n";
import { Dialog,Progress } from "./shared";

export default function Goals({
  state,
  dispatch,
  t,
  locale,
  notify,
}: PageProps) {
  const [goalId,setGoalId] = useState<string | null>(null);
  const [amount,setAmount] = useState("");
  const [error,setError] = useState(false);
  const goal = state.goals.find((g) => g.id === goalId);
  const available = balance(state,"everyday"),
    savingBalance = balance(state,"savings");
  const allocated = state.goals.reduce((a,g) => a + g.savedCents,0);
  function save(e: FormEvent) {
    e.preventDefault();
    const cents = parseMoney(amount);
    if (
      !goal ||
      cents === null ||
      cents > available ||
      cents > goal.targetCents - goal.savedCents
    ) {
      setError(true);
      document.getElementById("goal-amount")?.focus();
      return;
    }
    dispatch({
      type: "contribute",
      goalId: goal.id,
      amountCents: cents,
      id: `goal-${crypto.randomUUID()}`,
      date: cyprusToday(),
    });
    setGoalId(null);
    notify(t("goalAdded"));
  }
  const name = (g: Goal) => t(g.name);
  return (
    <>
      <div className="goals-summary">
        <div>
          <span>{t("savedLabel")}</span>
          <strong>{money(allocated,locale)}</strong>
          <p>{t("allocated")}</p>
        </div>
        <div>
          <span>{t("unallocated")}</span>
          <strong>{money(savingBalance - allocated,locale)}</strong>
        </div>
      </div>
      <div className="goal-grid">
        {state.goals.map((g) => (
          <section key={g.id} className="panel goal-card">
            <div className="goal-card-body">
              <div className="goal-card-heading">
                <h2>{name(g)}</h2>
                <span>{Math.round((g.savedCents / g.targetCents) * 100)}%</span>
              </div>
              <div className="goal-amount">
                <strong>{money(g.savedCents,locale)}</strong>
                <span>/ {money(g.targetCents,locale)}</span>
              </div>
              <Progress
                value={(g.savedCents / g.targetCents) * 100}
                label={name(g)}
              />
              <div className="goal-bottom">
                <button
                  className="button secondary"
                  disabled={g.savedCents >= g.targetCents || available === 0}
                  onClick={() => {
                    setGoalId(g.id);
                    setAmount("");
                    setError(false);
                  }}
                >
                  {t(g.savedCents >= g.targetCents ? "goalDone" : "addToGoal")}
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>
      <p className="notice">{t("goalFunding")}</p>
      {goal && (
        <Dialog
          title={`${t("addToGoal")} · ${name(goal)}`}
          closeLabel={t("close")}
          onClose={() => setGoalId(null)}
        >
          <p className="section-intro">{t("goalFunding")}</p>
          <dl className="detail-list">
            <div>
              <dt>{t("available")}</dt>
              <dd>{money(available,locale)}</dd>
            </div>
            <div>
              <dt>{t("budgetLeft")}</dt>
              <dd>{money(goal.targetCents - goal.savedCents,locale)}</dd>
            </div>
          </dl>
          <form onSubmit={save} noValidate>
            <label className="form-field" htmlFor="goal-amount">
              {t("amountEuro")}
              <input
                id="goal-amount"
                inputMode="decimal"
                required
                value={amount}
                placeholder="0.00"
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(false);
                }}
                aria-invalid={error}
                aria-describedby={error ? "goal-error" : undefined}
              />
            </label>
            {error && (
              <p id="goal-error" role="alert" className="field-error">
                {t("goalLimit")}
              </p>
            )}
            <div className="form-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setGoalId(null)}
              >
                {t("cancel")}
              </button>
              <button className="button primary" type="submit">
                {t("addToGoal")}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
