// daily-snapshot (BLUEPRINT §6): once daily after US market close, fetch VOO
// closes (Yahoo chart API, keyless; Stooq is behind an anti-bot wall now) and
// AUD/USD (Frankfurter/ECB, keyless) and upsert into the global snapshot
// tables. The 5-day VOO window makes each run self-heal gaps from holidays
// or failed runs. Idempotent per date. Triggered by pg_cron with a shared
// secret — not a user-facing endpoint (verify_jwt off, x-cron-secret gated).
import { createClient } from "npm:@supabase/supabase-js@2";

const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const results: Record<string, string> = {};

  // --- VOO closes from Yahoo chart API (last 5 trading days)
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/VOO?interval=1d&range=5d",
      { headers: { "User-Agent": "Mozilla/5.0 (mirror daily-snapshot)" } },
    );
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
    const rows = timestamps.flatMap((ts, i) => {
      const close = closes[i];
      if (close == null || !Number.isFinite(close) || close <= 0) return [];
      const date = new Date(ts * 1000).toISOString().slice(0, 10);
      return [{
        symbol: "VOO",
        date,
        close_price: Math.round(close * 100) / 100,
        currency: "USD",
      }];
    });
    if (rows.length === 0) throw new Error("no closes in Yahoo payload");
    const { error } = await supabase
      .from("price_snapshots")
      .upsert(rows, { onConflict: "symbol,date" });
    if (error) throw error;
    results.voo = rows.map((r) => `${r.date}=${r.close_price}`).join(", ");
  } catch (err) {
    results.voo_error = String(err instanceof Error ? err.message : err);
  }

  // --- AUD/USD from Frankfurter (rate = USD per 1 AUD)
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=AUD&symbols=USD",
    );
    const fx = await res.json();
    const rate = Number(fx?.rates?.USD);
    const date = fx?.date;
    if (!date || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`unexpected Frankfurter payload: ${JSON.stringify(fx).slice(0, 200)}`);
    }
    const { error } = await supabase
      .from("fx_snapshots")
      .upsert({ date, pair: "AUDUSD", rate }, { onConflict: "pair,date" });
    if (error) throw error;
    results.fx = `${date} AUDUSD ${rate}`;
  } catch (err) {
    results.fx_error = String(err instanceof Error ? err.message : err);
  }

  const failed = results.voo_error && results.fx_error;
  return new Response(JSON.stringify(results), {
    status: failed ? 500 : 200,
    headers: { "content-type": "application/json" },
  });
});
