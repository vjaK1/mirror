// ai-ask (BLUEPRINT §5 Job 2): plain-English questions answered from
// Victor's own data via a tool-calling loop. Tools execute through the
// mirror_readonly Postgres role — SELECT-only on whitelisted functions,
// no raw table access (CLAUDE.md rule 4). Returns the answer plus which
// tools ran ("show the query" affordance).
import postgres from "npm:postgres@3.4.5";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = Deno.env.get("MIRROR_AI_MODEL") ?? "claude-sonnet-5";
const READONLY_URL = Deno.env.get("MIRROR_READONLY_URL")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOOLS = [
  {
    name: "get_remaining_today",
    description:
      "Today's (logical day, ends 03:00 Melbourne) eaten macros, active phase targets, and remaining amounts.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_macros_range",
    description: "Daily macro totals (kcal, protein, carbs, fat, fibre) for the last N logical days.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "integer", minimum: 1, maximum: 90, description: "Days back (default 7)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_weight_trend",
    description:
      "Weigh-in series with 7-day trailing average, current average, and slope in kg/week over the last N days.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "integer", minimum: 7, maximum: 365, description: "Window (default 30)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_lift_progression",
    description:
      "Top set per session (weight, reps, estimated 1RM) for one exercise, matched by name (e.g. 'bench').",
    input_schema: {
      type: "object",
      properties: {
        exercise: { type: "string", description: "Exercise name or fragment" },
      },
      required: ["exercise"],
      additionalProperties: false,
    },
  },
  {
    name: "get_session_adherence",
    description: "Training sessions per week for the last 8 weeks (with types) and the weekly target.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_networth",
    description:
      "Current net worth in AUD: account balances, VOO holding (shares, latest price, USD and AUD value), FX rate used.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_networth_history",
    description: "Daily net worth in AUD for the last N days (from balance events and price/FX snapshots).",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "integer", minimum: 7, maximum: 365, description: "Window (default 90)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_income_summary",
    description: "Income total and per-source breakdown for the current week, month, or year (Melbourne time).",
    input_schema: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["week", "month", "year"] },
      },
      additionalProperties: false,
    },
  },
];

async function runTool(
  sql: ReturnType<typeof postgres>,
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "get_remaining_today":
      return (await sql`select public.get_remaining_today() as r`)[0].r;
    case "get_macros_range":
      return (await sql`select public.get_macros_range(${Number(input.days ?? 7)}) as r`)[0].r;
    case "get_weight_trend":
      return (await sql`select public.get_weight_trend(${Number(input.days ?? 30)}) as r`)[0].r;
    case "get_lift_progression":
      return (await sql`select public.get_lift_progression(${String(input.exercise ?? "")}) as r`)[0].r;
    case "get_session_adherence":
      return (await sql`select public.get_session_adherence() as r`)[0].r;
    case "get_networth":
      return (await sql`select public.get_networth() as r`)[0].r;
    case "get_networth_history":
      return (await sql`select public.get_networth_history(${Number(input.days ?? 90)}) as r`)[0].r;
    case "get_income_summary":
      return (await sql`select public.get_income_summary(${String(input.period ?? "month")}) as r`)[0].r;
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

type ContentBlock = {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });

  const sql = postgres(READONLY_URL, { prepare: false, max: 1, ssl: "require" });
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string" || question.length > 500) {
      return json({ error: "Provide 'question' (max 500 chars)" }, 400);
    }

    const today = new Intl.DateTimeFormat("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Australia/Melbourne",
    }).format(new Date());

    const system = [
      `You answer questions about Victor's personal data (diet, training, weight, money) using the read-only tools. Today is ${today} in Melbourne; the logical day ends at 03:00 (a 1am meal belongs to the previous day).`,
      "Always fetch real numbers with tools before answering — never estimate from memory. Money: VOO is USD, converted to AUD via the daily FX snapshot; report AUD unless asked otherwise.",
      "Be concise and concrete: lead with the answer and the key numbers, then one or two lines of context. Use kg, g, kcal, $ as appropriate. If the tools can't answer (missing data or out of scope), say exactly what's missing. Notes and goals aren't tracked yet.",
      "Plain text only: no markdown, no asterisks, no headers. Short lines and simple hyphen lists are fine.",
    ].join("\n");

    const messages: { role: string; content: unknown }[] = [
      { role: "user", content: question },
    ];
    const toolCalls: { name: string; input: unknown; result: unknown }[] = [];
    let answer = "";

    for (let turn = 0; turn < 6; turn++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1500,
          output_config: { effort: "medium" },
          system,
          tools: TOOLS,
          messages,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 300)}`);
      }
      const message = await res.json();
      if (message.stop_reason === "refusal") {
        throw new Error("Model declined the request");
      }

      const blocks = (message.content ?? []) as ContentBlock[];
      const toolUses = blocks.filter((b) => b.type === "tool_use");

      if (message.stop_reason !== "tool_use" || toolUses.length === 0) {
        answer = blocks
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        break;
      }

      messages.push({ role: "assistant", content: blocks });
      const results = [];
      for (const use of toolUses) {
        let result: unknown;
        let isError = false;
        try {
          result = await runTool(sql, use.name!, use.input ?? {});
        } catch (err) {
          result = { error: String(err instanceof Error ? err.message : err) };
          isError = true;
        }
        toolCalls.push({ name: use.name!, input: use.input ?? {}, result });
        results.push({
          type: "tool_result",
          tool_use_id: use.id!,
          content: JSON.stringify(result),
          ...(isError ? { is_error: true } : {}),
        });
      }
      messages.push({ role: "user", content: results });
    }

    if (!answer) {
      answer = "I couldn't finish answering that — try rephrasing the question.";
    }
    return json({ answer, tool_calls: toolCalls });
  } catch (err) {
    console.error("ai-ask error:", err);
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  } finally {
    await sql.end({ timeout: 2 });
  }
});
