# Kypra — Account Dashboard

A React app with account balances, monthly reports, transaction search, transfers, budgets and savings goals. The interface is available in English and Greek.

All data is fictional. You do not need a banking account, API key or database.

## Run the app

### 1. Install Node.js and pnpm

Install **Node.js 24 or newer** from [nodejs.org](https://nodejs.org/en/download). Node includes npm.

Open a new terminal after installation and run:

```bash
node --version
npm install --global pnpm@11.25.0
pnpm --version
```

The versions should show Node `v24.` or newer and pnpm `11.25.0`. If a command is not recognised, reopen the terminal.

### 2. Open the project folder

Extract the ZIP, then open the **`kypra` folder** in VS Code, WebStorm or IntelliJ IDEA. This folder contains `package.json`, `README.md` and `src`.

Open the editor's terminal:

- **VS Code:** Terminal → New Terminal.
- **WebStorm / IntelliJ:** open the Terminal tool window.

If you use a separate terminal, use `cd` to move into the extracted folder. The terminal must be inside the folder containing `package.json`.

### 3. Install dependencies and start

Run these commands in that terminal. Wait for installation to finish before starting the app.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The first installation needs an internet connection. **Keep the terminal open and the server running.**

### 4. Open the UI

Visit **[http://localhost:5173](http://localhost:5173)** in your browser. You should see Kypra's **Account overview** page.

Use the navigation to switch pages and **EN / EL** to change language. If you choose a different port, open the URL printed in the terminal.

Do not double-click `index.html`; the app needs the development server.

To stop the app, press **Ctrl + C** in its terminal. Next time, just run `pnpm dev` again. Reinstall dependencies only if the dependency files change or you delete `node_modules`.

## Try the features

| Page | What to try |
| --- | --- |
| Overview | Select **October 2026** for the sample reports. September shows the empty state. Account balances include all months. |
| Transactions | Search `AlphaMega`, filter by category, open a transaction and export CSV. |
| Transfers | Choose **Use sample recipient**, enter `12.34`, review and confirm the demo transfer. |
| Budgets | Edit a category's limit and check the remaining amount. |
| Savings goals | Add `10.00` to a goal. The amount moves from Everyday to Savings. |
| Settings | Change language, reset the sample data, or simulate an API failure and retry. |

Changes are saved in your browser's local storage. Refreshing keeps valid changes; a different browser or local URL has separate data. **Settings → Reset demo data** restores the starting values.

New transfers use today's date in Cyprus. Select that month to see them in the reports. The original sample transactions are from **October 2026**.

## Commands

Run these inside the project folder. Open a second terminal for checks while the development server is running.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server and open its local URL. |
| `pnpm run typecheck` | Check TypeScript types. |
| `pnpm run build` | Check types and create the production frontend in `dist`. |
| `pnpm start` | Preview the production build locally. Run the build command first. |

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html`, `src/main.tsx` | HTML entry point and React setup. |
| `src/BankingApp.tsx` | Navigation, language, reporting month and shared page state. |
| `src/components/` | Screens, chart, transaction table and dialogs. |
| `src/domain/` | Types, sample data, calculations, validation and reducer. |
| `src/hooks/`, `src/services/` | API loading and browser persistence. |
| `src/i18n.ts` | English/Greek text and date/currency formatting. |
| `src/styles.css` | All styles and responsive layouts. |
| `server/demo.ts`, `vite.config.ts` | Mock API and local server configuration. |
| `public/` | Favicon. |
| `.vscode/settings.json` | Points VS Code to the project's TypeScript installation. |

The project uses **React, TypeScript, semantic HTML, plain CSS and Vite**.

`node_modules` and `dist` are generated folders ignored by Git. Leave them out of any ZIP you share. They can be deleted: `pnpm install --frozen-lockfile` recreates dependencies, and `pnpm run build` recreates the build.

Keep `pnpm-lock.yaml` for consistent dependency versions. `pnpm-workspace.yaml` records dependency build permissions.

## Inspect the demo API

With the server running, open [http://localhost:5173/api/demo](http://localhost:5173/api/demo) to see the sample data as JSON. Browser-local edits do not change this response.

The mock API runs during development and local production preview. Hosting only the static `dist` folder elsewhere requires an equivalent `/api/demo` endpoint.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `node`, `npm` or `pnpm` is not recognised | Install the tools in step 1, then reopen the terminal. |
| PowerShell says scripts are disabled | Use Command Prompt, or use `npm.cmd` and `pnpm.cmd`. |
| Cannot find `package.json` | Open the terminal inside the extracted `kypra` folder. |
| Browser cannot reach the app | Check that `pnpm dev` is running. Open the exact local URL it prints. |
| Port 5173 is in use | Stop the other server with Ctrl + C, or run `pnpm dev --port 5174`. |
| Reports are empty | Select October 2026, or the month of your new transactions. |
| An API error appears | Click **Retry** to reload the normal demo endpoint. |
| VS Code underlines `ES2023` | Open a `.tsx` file, run **TypeScript: Select TypeScript Version** from the Command Palette and choose **Use Workspace Version** (5.9.3). Install dependencies first if that option is missing. |
| Installation or checks fail | Check your internet connection and Node/pnpm versions. Keep the lockfile and rerun the install command. |

Kypra is an independent portfolio demo and is not affiliated with Bank of Cyprus. It does not connect to a bank or process payments.
