import { useEffect,useRef,useState } from "react";
import type { Locale,Page } from "./domain/types";
import { SAMPLE_MONTH } from "./domain/seed";
import { isReportMonth } from "./domain/banking";
import { translator,type Key } from "./i18n";
import { useBank } from "./hooks/useBank";
import Overview from "./components/Overview";
import Transactions from "./components/Transactions";
import Transfers from "./components/Transfers";
import Budgets from "./components/Budgets";
import Goals from "./components/Goals";
import Settings from "./components/Settings";

const PAGES: Page[] = [
  "overview",
  "transactions",
  "transfers",
  "budgets",
  "goals",
  "settings",
];
const INTROS: Record<Page,Key> = {
  overview: "intro",
  transactions: "transactionIntro",
  transfers: "transferIntro",
  budgets: "budgetIntro",
  goals: "goalsIntro",
  settings: "settingsIntro",
};

export default function BankingApp() {
  const { state,dispatch,status,reload,storageWarning } = useBank();
  const [page,setPage] = useState<Page>("overview");
  const [locale,setLocale] = useState<Locale>("en");
  const [month,setMonth] = useState(SAMPLE_MONTH);
  const [hidden,setHidden] = useState(false);
  const [toast,setToast] = useState("");
  const main = useRef<HTMLElement>(null);
  const t = translator(locale);

  useEffect(() => {
    const sync = () => {
      const name = location.hash.slice(1);
      setPage(PAGES.includes(name as Page) ? (name as Page) : "overview");
    };
    sync();
    window.addEventListener("hashchange",sync);
    try {
      const saved = localStorage.getItem("kypra-locale");
      if (saved === "el" || saved === "en") setLocale(saved);
    } catch {
      /* Optional preference. */
    }
    return () => window.removeEventListener("hashchange",sync);
  },[]);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem("kypra-locale",locale);
    } catch {
      /* The app also works without local storage. */
    }
  },[locale]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""),4500);
    return () => clearTimeout(timer);
  },[toast]);

  function navigate(next: Page) {
    location.hash = next;
    setPage(next);
    requestAnimationFrame(() => {
      main.current?.focus();
      window.scrollTo({ top: 0,behavior: "instant" });
    });
  }
  const props = {
    state,
    dispatch,
    locale,
    month,
    t,
    navigate,
    notify: setToast,
  };

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        {t("skip")}
      </a>
      <header className="app-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              navigate("overview");
            }}
          >
            Kypra <span>{t("appName")}</span>
          </a>
          <div className="header-actions">
            <span className="sample-label">{t("sample")}</span>
            <div
              className="language-switch"
              role="group"
              aria-label={t("language")}
            >
              <button
                aria-label="English"
                aria-pressed={locale === "en"}
                onClick={() => setLocale("en")}
              >
                EN
              </button>
              <button
                aria-label="Ελληνικά"
                lang="el"
                aria-pressed={locale === "el"}
                onClick={() => setLocale("el")}
              >
                EL
              </button>
            </div>
          </div>
        </div>
        <nav className="main-nav" aria-label={t("mainNav")}>
          {PAGES.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={page === id ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(id);
              }}
            >
              {t(id)}
            </a>
          ))}
        </nav>
      </header>

      <main id="main-content" ref={main} tabIndex={-1} className="main-content">
        <div className="page-heading">
          <div>
            <h1>{page === "overview" ? t("heading") : t(page)}</h1>
            <p>{t(INTROS[page])}</p>
          </div>
          {(page === "overview" || page === "budgets") && (
            <label className="month-field" htmlFor="report-month">
              {t("reportingMonth")}
              <input
                id="report-month"
                type="month"
                value={month}
                min="1900-01"
                max="2100-12"
                onChange={(e) => {
                  if (isReportMonth(e.target.value)) setMonth(e.target.value);
                }}
              />
            </label>
          )}
        </div>
        {storageWarning && (
          <p role="status" className="notice">
            {t("storageWarning")}
          </p>
        )}
        {status === "loading" ? (
          <section className="panel status-panel" role="status">
            <p>{t("loading")}</p>
          </section>
        ) : status === "error" ? (
          <section className="panel status-panel" role="alert">
            <h2>{t("apiError")}</h2>
            <p>{t("apiErrorText")}</p>
            <button className="button primary" onClick={() => reload()}>
              {t("retry")}
            </button>
          </section>
        ) : (
          <div key={page}>
            {page === "overview" && (
              <Overview {...props} hidden={hidden} setHidden={setHidden} />
            )}
            {page === "transactions" && <Transactions {...props} />}
            {page === "transfers" && <Transfers {...props} />}
            {page === "budgets" && <Budgets {...props} />}
            {page === "goals" && <Goals {...props} />}
            {page === "settings" && (
              <Settings
                {...props}
                setLocale={setLocale}
                hidden={hidden}
                setHidden={setHidden}
                reload={reload}
              />
            )}
          </div>
        )}
        <footer className="page-footer">
          <span>{t("footer")}</span>
          <span>{t("fictional")}</span>
        </footer>
      </main>
      <div
        className={`toast ${toast ? "visible" : ""}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast}
      </div>
    </div>
  );
}
