import { useEffect,useReducer,useState } from "react";
import { bankReducer,isBankState } from "../domain/banking";
import { SEED } from "../domain/seed";
import { fetchDemo } from "../services/api";
export const STORAGE_KEY = "kypra-demo-v1";
export function useBank() {
  const [state,dispatch] = useReducer(bankReducer,SEED);
  const [status,setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [storageWarning,setStorageWarning] = useState(false);
  const [request,setRequest] = useState({
    attempt: 0,
    reset: false,
    failure: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    (async () => {
      try {
        const data = await fetchDemo(controller.signal,request.failure);
        if (controller.signal.aborted) return;
        let restored = data;
        if (!request.reset) {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const parsed: unknown = JSON.parse(saved);
              if (isBankState(parsed)) restored = parsed;
              else setStorageWarning(true);
            }
          } catch {
            setStorageWarning(true);
          }
        }
        dispatch({ type: "load",state: restored });
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    })();
    return () => controller.abort();
  },[request]);
  useEffect(() => {
    if (status !== "ready") return;
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    } catch {
      setStorageWarning(true);
    }
  },[state,status]);
  const reload = (reset = false,failure = false) => {
    setRequest((r) => ({ attempt: r.attempt + 1,reset,failure }));
  };
  return { state,dispatch,status,storageWarning,reload };
}
