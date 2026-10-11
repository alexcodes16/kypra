import { useId } from "react";
import { monthlyCashFlow } from "../domain/banking";
import type { Locale,Transaction } from "../domain/types";
import { money,monthLabel,type Translate } from "../i18n";

export default function CashFlowChart({
  transactions,
  month,
  locale,
  t,
}: {
  transactions: Transaction[];
  month: string;
  locale: Locale;
  t: Translate;
}) {
  const titleId = useId();
  const points = monthlyCashFlow(transactions,month);
  if (!points.length) return null;
  const width = 540,
    height = 240;
  const left = 82,
    right = 18,
    top = 12,
    bottom = 34;
  const max =
    Math.ceil(
      Math.max(10000,...points.flatMap((p) => [p.income,p.spending])) / 10000,
    ) * 10000;
  const x =(day: number) =>
    left + ((day - 1) / (points.length - 1))* (width -left-right);
  const y = (value: number) =>
    height - bottom - (value / max) * (height-top-bottom);
  const path = (key: "income" | "spending") =>
    points.map((p,i) => `${i ? "L" : "M"}${x(p.day)},${y(p[key])}`).join(" ");
  const days = Array.from(new Set([1,8,15,22,points.length]));
  return (
    <>
      <div className="chart-legend">
        <span className="income-line">{t("income")}</span>
        <span className="spending-line">{t("spending")}</span>
      </div>
      <div className="chart-plot">
        <svg
          className="cashflow-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={titleId}
        >
          <title id={titleId}>
            {t("chart")} — {monthLabel(month,locale)}
          </title>
          {[0,max / 2,max].map((value) => (
            <g key={value}>
              <line
                x1={left}
                y1={y(value)}
                x2={width - right}
                y2={y(value)}
                className="chart-grid-line"
              />
              <text x={left - 10} y={y(value) + 4} textAnchor="end">
                {money(value,locale)}
              </text>
            </g>
          ))}
          {days.map((day) => (
            <text key={day} x={x(day)} y={height - 10} textAnchor="middle">
              {day}
            </text>
          ))}
          <path d={path("income")} className="chart-income" />
          <path d={path("spending")} className="chart-spending" />
        </svg>
      </div>
      <details className="chart-data">
        <summary>{t("chartDetails")}</summary>
        <div className="chart-data-scroll table-wrap">
          <table>
            <caption>
              {t("cashflow")} — {monthLabel(month,locale)}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("day")}</th>
                <th scope="col" className="number">
                  {t("income")}
                </th>
                <th scope="col" className="number">
                  {t("spending")}
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.day}>
                  <th scope="row">{p.day}</th>
                  <td className="number">{money(p.income,locale)}</td>
                  <td className="number">{money(p.spending,locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
