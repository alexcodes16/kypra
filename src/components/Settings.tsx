import { useState } from "react";
import type { PageProps } from "../context";
import type { Locale } from "../domain/types";
import { Dialog } from "./shared";
export default function Settings({
  t,
  locale,
  setLocale,
  hidden,
  setHidden,
  reload,
}: PageProps & {
  setLocale: (locale: Locale) => void;
  hidden: boolean;
  setHidden: (value: boolean) => void;
  reload: (reset?: boolean,failure?: boolean) => void;
}) {
  const [confirmReset,setConfirmReset] = useState(false);
  return (
    <div className="settings-layout">
      <section className="panel settings-panel">
        <div className="setting-row">
          <div>
            <h2>{t("language")}</h2>
            <p>{t("languageText")}</p>
          </div>
          <div
            className="language-switch"
            role="group"
            aria-label={t("language")}
          >
            <button
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
            >
              English
            </button>
            <button
              lang="el"
              aria-pressed={locale === "el"}
              onClick={() => setLocale("el")}
            >
              Ελληνικά
            </button>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <h2>{t("balancePrivacy")}</h2>
            <p>{t("balanceText")}</p>
          </div>
          <button
            className="button secondary"
            aria-pressed={hidden}
            onClick={() => setHidden(!hidden)}
          >
            {t(hidden ? "showBalance" : "hideBalance")}
          </button>
        </div>
        <div className="setting-row">
          <div>
            <h2>{t("apiDemo")}</h2>
            <p>{t("apiText")}</p>
          </div>
          <button
            className="button secondary"
            onClick={() => reload(false,true)}
          >
            {t("simulateError")}
          </button>
        </div>
        <div className="setting-row">
          <div>
            <h2>{t("reset")}</h2>
            <p>{t("resetText")}</p>
          </div>
          <button
            className="button secondary danger"
            onClick={() => setConfirmReset(true)}
          >
            {t("reset")}
          </button>
        </div>
      </section>
      <section className="panel about-panel">
        <h2>{t("about")}</h2>
        <p>{t("aboutText")}</p>
        <p>{t("dataDate")}</p>
      </section>
      {confirmReset && (
        <Dialog
          title={t("resetConfirm")}
          closeLabel={t("close")}
          onClose={() => setConfirmReset(false)}
        >
          <p className="section-intro">{t("resetConfirmText")}</p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setConfirmReset(false)}
            >
              {t("cancel")}
            </button>
            <button
              className="button primary"
              onClick={() => {
                setConfirmReset(false);
                reload(true);
              }}
            >
              {t("yesReset")}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
