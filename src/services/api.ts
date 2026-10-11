import { isBankState } from "../domain/banking.ts";
import type { BankState } from "../domain/types.ts";
export async function fetchDemo(
  signal: AbortSignal,
  failure = false,
): Promise<BankState> {
  const response = await fetch(`/api/demo${failure ? "?failure=1" : ""}`,{
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Demo API returned ${response.status}`);
  const data: unknown = await response.json();
  if (!isBankState(data)) throw new Error("Invalid demo data");
  return data;
}
