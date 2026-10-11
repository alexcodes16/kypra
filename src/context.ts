import type { Dispatch } from "react";
import type { Action,BankState,Locale,Page } from "./domain/types";
import type { Translate } from "./i18n";
export interface PageProps {
  state: BankState;
  dispatch: Dispatch<Action>;
  locale: Locale;
  month: string;
  t: Translate;
  notify: (message: string) => void;
  navigate: (page: Page) => void;
}
