import { useRef,useState,type FormEvent } from "react";
import {
  balance,
  parseMoney,
  validateTransfer,
  type TransferErrors,
} from "../domain/banking";
import type { ConfirmedTransfer,TransferDraft } from "../domain/types";
import type { PageProps } from "../context";
import { cyprusToday,dateLabel,money } from "../i18n";

type Flow =
  | { step: "details" }
  | { step: "review" | "done"; transfer: ConfirmedTransfer };
const EMPTY: TransferDraft = { name: "",iban: "",amount: "",reference: "" };
export default function Transfers({
  state,
  dispatch,
  t,
  locale,
  navigate,
  notify,
}: PageProps) {
  const [draft,setDraft] = useState<TransferDraft>(EMPTY);
  const [errors,setErrors] = useState<TransferErrors>({});
  const [flow,setFlow] = useState<Flow>({ step: "details" });
  const heading = useRef<HTMLHeadingElement>(null);
  const committed = useRef(false);
  const available = balance(state,"everyday");
  const change = (key: keyof TransferDraft,value: string) => {
    setDraft((d) => ({ ...d,[key]: value }));
    setErrors((e) => ({ ...e,[key]: undefined }));
  };
  function review(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateTransfer(draft,available);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document
        .getElementById(`transfer-${Object.keys(nextErrors)[0]}`)
        ?.focus();
      return;
    }
    committed.current = false;
    setFlow({
      step: "review",
      transfer: {
        id: `demo-${crypto.randomUUID()}`,
        name: draft.name.trim(),
        iban: draft.iban.replace(/\s/g,"").toUpperCase(),
        amountCents: parseMoney(draft.amount)!,
        reference: draft.reference.trim(),
        date: cyprusToday(),
      },
    });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function confirm() {
    if (flow.step !== "review" || committed.current) return;
    if (flow.transfer.amountCents > available) {
      setErrors({ amount: "fundsError" });
      setFlow({ step: "details" });
      return;
    }
    committed.current = true;
    dispatch({ type: "transfer",transfer: flow.transfer });
    setFlow({ step: "done",transfer: flow.transfer });
    notify(t("transferDone"));
    requestAnimationFrame(() => heading.current?.focus());
  }
  const field = (
    key: keyof TransferDraft,
    label: string,
    placeholder: string,
  ) => (
    <label className="form-field" htmlFor={`transfer-${key}`}>
      {label}
      {key === "reference" && <span className="optional">{t("optional")}</span>}
      <input
        id={`transfer-${key}`}
        name={key}
        value={draft[key]}
        placeholder={placeholder}
        onChange={(e) => change(key,e.target.value)}
        inputMode={key === "amount" ? "decimal" : "text"}
        autoComplete={key === "name" ? "name" : "off"}
        aria-invalid={!!errors[key]}
        aria-describedby={
          errors[key]
            ? `error-${key}`
            : key === "iban"
              ? "iban-help"
              : undefined
        }
        required={key !== "reference"}
        maxLength={
          key === "reference"
            ? 100
            : key === "name"
              ? 60
              : key === "iban"
                ? 40
                : 12
        }
      />
      {errors[key] && (
        <span className="field-error" id={`error-${key}`}>
          {t(errors[key]!)}
        </span>
      )}
    </label>
  );
  return (
    <div className="transfer-layout">
      <section className="panel transfer-panel">
        <ol className="stepper" aria-label={t("transfers")}>
          {(["details","review","done"] as const).map((step,index) => (
            <li
              key={step}
              className={
                step === flow.step
                  ? "current"
                  : index < ["details","review","done"].indexOf(flow.step)
                    ? "finished"
                    : ""
              }
              aria-current={step === flow.step ? "step" : undefined}
            >
              {index + 1}.{" "}
              {t(
                step === "details"
                  ? "detailsStep"
                  : step === "review"
                    ? "reviewStep"
                    : "doneStep",
              )}
            </li>
          ))}
        </ol>
        {flow.step === "details" ? (
          <form noValidate onSubmit={review}>
            <h2 ref={heading} tabIndex={-1}>
              {t("detailsStep")}
            </h2>
            <div className="from-account">
              <div>
                <span>{t("fromAccount")}</span>
                <strong>{t("everyday")} · 0428</strong>
              </div>
              <div className="from-balance">
                <span>{t("available")}</span>
                <strong>{money(available,locale)}</strong>
              </div>
            </div>
            <button
              type="button"
              className="text-button sample-recipient"
              onClick={() => {
                setDraft((d) => ({
                  ...d,
                  name: "Eleni Georgiou",
                  iban: "CY86 9990 0000 0000 0000 0000 0001",
                }));
                setErrors({});
              }}
            >
              {t("useSample")}
            </button>
            {Object.values(errors).some(Boolean) && (
              <p className="form-error" role="alert">
                {t("formError")}
              </p>
            )}
            {field("name",t("recipient"),t("recipientPlaceholder"))}
            {field("iban",t("iban"),"CY00 0000 0000 0000 0000 0000 0000")}
            <p id="iban-help" className="field-help">
              {t("sampleRecipient")}
            </p>
            <div className="form-pair">
              {field("amount",t("amountEuro"),"0.00")}
              {field("reference",t("reference"),t("referencePlaceholder"))}
            </div>
            <button className="button primary full" type="submit">
              {t("reviewTransfer")}
            </button>
          </form>
        ) : flow.step === "review" ? (
          <div>
            <h2 ref={heading} tabIndex={-1}>
              {t("reviewStep")}
            </h2>
            <p className="section-intro">{t("reviewMessage")}</p>
            <div className="review-amount">
              {money(flow.transfer.amountCents,locale)}
              <span>
                {t("to")} {flow.transfer.name}
              </span>
            </div>
            <dl className="detail-list">
              <div>
                <dt>{t("fromAccount")}</dt>
                <dd>{t("everyday")} · 0428</dd>
              </div>
              <div>
                <dt>{t("recipient")}</dt>
                <dd>{flow.transfer.name}</dd>
              </div>
              <div>
                <dt>{t("iban")}</dt>
                <dd className="mono">{flow.transfer.iban}</dd>
              </div>
              <div>
                <dt>{t("reference")}</dt>
                <dd>{flow.transfer.reference || "—"}</dd>
              </div>
              <div>
                <dt>{t("doneDate")}</dt>
                <dd>{dateLabel(flow.transfer.date,locale)}</dd>
              </div>
              <div className="total-detail">
                <dt>{t("totalDebit")}</dt>
                <dd>{money(flow.transfer.amountCents,locale)}</dd>
              </div>
            </dl>
            <div className="form-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setFlow({ step: "details" });
                  requestAnimationFrame(() => heading.current?.focus());
                }}
              >
                {t("back")}
              </button>
              <button className="button primary" onClick={confirm}>
                {t("confirmTransfer")}
              </button>
            </div>
          </div>
        ) : (
          <div className="transfer-success">
            <h2 ref={heading} tabIndex={-1}>
              {t("transferDone")}
            </h2>
            <p>{t("receipt")}</p>
            <div className="review-amount">
              {money(flow.transfer.amountCents,locale)}
              <span>
                {t("to")} {flow.transfer.name}
              </span>
            </div>
            <dl className="detail-list">
              <div>
                <dt>{t("transferId")}</dt>
                <dd className="mono">{flow.transfer.id}</dd>
              </div>
              <div>
                <dt>{t("date")}</dt>
                <dd>{dateLabel(flow.transfer.date,locale)}</dd>
              </div>
            </dl>
            <div className="form-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setFlow({ step: "details" });
                  setDraft(EMPTY);
                  setErrors({});
                }}
              >
                {t("anotherTransfer")}
              </button>
              <button
                className="button primary"
                onClick={() => navigate("transactions")}
              >
                {t("transactions")}
              </button>
            </div>
          </div>
        )}
      </section>
      <p className="notice">{t("transferNotice")}</p>
    </div>
  );
}
