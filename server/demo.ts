import { SEED } from "../src/domain/seed.ts";
export function GET(request: Request) {
  if (new URL(request.url).searchParams.get("failure") === "1") {
    return Response.json(
      { error: "Demonstration service unavailable" },
      { status: 503,headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json(SEED,{
    headers: { "Cache-Control": "no-store","X-Kypra-Data": "fictional" },
  });
}
