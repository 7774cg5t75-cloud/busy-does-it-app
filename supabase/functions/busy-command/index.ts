import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_COMMAND_MODEL = "gpt-6-luna";
const DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const MAX_AUDIO_BYTES = 10_000_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-busy-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const intents = [
  "business_summary",
  "open_today",
  "open_calendar",
  "open_quote_followups",
  "open_repeat_customers",
  "find_more_work",
  "customer_lookup",
  "create_booking",
  "complete_job",
  "social_post",
  "reactivation_draft",
  "quick_capture",
  "open_inbox",
  "open_results",
  "open_settings",
  "unknown",
];

const commandSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "intent",
    "title",
    "response",
    "confidence",
    "requiresConfirmation",
    "actionLabel",
    "customerName",
    "service",
    "date",
    "time",
    "value",
    "note",
  ],
  properties: {
    intent: { type: "string", enum: intents },
    title: { type: "string" },
    response: { type: "string" },
    confidence: { type: "string", enum: ["High", "Medium", "Low"] },
    requiresConfirmation: { type: "boolean" },
    actionLabel: { type: "string" },
    customerName: { type: "string" },
    service: { type: "string" },
    date: { type: "string" },
    time: { type: "string" },
    value: { type: "number", minimum: 0 },
    note: { type: "string" },
  },
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function cleanText(value: unknown, max = 8000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeContext(value: any) {
  const context = value && typeof value === "object" ? value : {};
  return {
    today: cleanText(context.today, 20),
    timezone: cleanText(context.timezone, 80) || "Europe/London",
    businessName: cleanText(context.businessName, 200),
    trade: cleanText(context.trade, 200),
    selectedService: cleanText(context.selectedService, 200),
    services: Array.isArray(context.services) ? context.services.slice(0, 30) : [],
    counts: context.counts && typeof context.counts === "object" ? context.counts : {},
    activeWorkGoal:
      context.activeWorkGoal && typeof context.activeWorkGoal === "object"
        ? context.activeWorkGoal
        : null,
    nextBookings: Array.isArray(context.nextBookings) ? context.nextBookings.slice(0, 12) : [],
    dueQuoteCustomers: Array.isArray(context.dueQuoteCustomers)
      ? context.dueQuoteCustomers.slice(0, 10)
      : [],
    quietEnquiryCustomers: Array.isArray(context.quietEnquiryCustomers)
      ? context.quietEnquiryCustomers.slice(0, 10)
      : [],
    customers: Array.isArray(context.customers) ? context.customers.slice(0, 60) : [],
  };
}

async function transcribeAudio(file: File) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  if (!file.size || file.size > MAX_AUDIO_BYTES) {
    throw new Error("Voice command is empty or too large.");
  }
  const form = new FormData();
  form.append("file", file, file.name || "busy-command.m4a");
  form.append("model", Deno.env.get("OPENAI_TRANSCRIBE_MODEL") || DEFAULT_TRANSCRIBE_MODEL);
  form.append("response_format", "json");

  const response = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Transcription failed with ${response.status}.`);
  }
  const text = cleanText(payload?.text, 4000);
  if (!text) throw new Error("BUSY could not hear a usable voice command.");
  return text;
}

function commandPrompt(text: string, context: any) {
  return `You are the command router for BUSY DOES IT, a UK small-business operating assistant.

The owner said:
"${text}"

Today is ${context.today || "not supplied"} in ${context.timezone || "Europe/London"}.

Use ONLY the supplied business context. Never invent a customer, booking, quote, value, result or business change.

Choose exactly one intent:
- business_summary: answer a factual question from counts/current records, with no navigation required.
- open_today: the owner asks what needs doing, what changed, or wants the weekly/current operating view.
- open_calendar: asks to see diary/calendar/bookings generally.
- open_quote_followups: asks which quotes need chasing/following up.
- open_repeat_customers: asks who may be due again/repeat work.
- find_more_work: wants to fill capacity, get more work, or target a quiet day.
- customer_lookup: wants to open or inspect one existing customer.
- create_booking: explicitly asks to book/schedule one saved customer. This MUST require confirmation.
- complete_job: explicitly says a booked job is finished/completed. This MUST require confirmation.
- social_post: asks to draft/create social content, especially from a completed job. This only opens/prepares a draft and MUST NOT claim it published.
- reactivation_draft: asks to draft wording to previous customers or the best few customers. This prepares internal drafts only and MUST NOT claim anything was sent.
- quick_capture: asks BUSY to capture/file a new business fact that does not safely map to a supported direct record action. This opens owner review and MUST NOT claim it was filed.
- open_inbox: asks to review incoming BUSY Inbox items.
- open_results: asks for business results/performance/outcomes.
- open_settings: asks for settings/account/connected account controls.
- unknown: insufficient or ambiguous request.

Rules:
1. Creating a booking or completing a job requiresConfirmation=true. All other intents are false because they either answer, navigate or prepare internal work only.
2. External customer messages, public social publishing and paid advertising are NEVER executed by this command router. The response must say a draft/review step will open when relevant.
3. If a customer is needed, customerName must exactly match ONE name in the supplied context. If the name is ambiguous or absent, use unknown.
4. For create_booking, resolve explicit/relative dates to YYYY-MM-DD where confidently possible. Resolve times to HH:MM. If the owner omitted a required date, use unknown rather than guessing.
5. For complete_job, only choose it when the context shows an open saved booking for that customer.
6. For "what changed since yesterday" or similar, do not invent changes: choose open_today and explain the saved Work briefing should be opened.
7. For business_summary, make the answer concise and factual from the supplied counts and nextBookings only.
8. value is a numeric GBP amount when explicitly stated or directly supported; otherwise 0.
9. note carries useful user wording/context for a draft or completion note. Keep it short.
10. actionLabel should clearly describe the safe next UI action.

Business context:
${JSON.stringify(context)}`;
}

async function routeCommand(text: string, context: any) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const model = Deno.env.get("OPENAI_COMMAND_MODEL") || DEFAULT_COMMAND_MODEL;

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      input: commandPrompt(text, context),
      text: {
        format: {
          type: "json_schema",
          name: "busy_command",
          strict: true,
          schema: commandSchema,
        },
      },
      max_output_tokens: 1400,
      store: false,
    }),
  });

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `OpenAI command routing failed with ${response.status}.`);
  }

  const outputText =
    typeof payload?.output_text === "string"
      ? payload.output_text
      : Array.isArray(payload?.output)
      ? payload.output
          .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
          .filter((item: any) => item?.type === "output_text")
          .map((item: any) => item.text || "")
          .join("")
      : "";

  if (!outputText) throw new Error("BUSY received no command interpretation.");

  let parsed: any;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("BUSY could not parse the command interpretation.");
  }

  if (!intents.includes(parsed?.intent)) parsed.intent = "unknown";
  parsed.title = cleanText(parsed?.title, 180) || "BUSY understood";
  parsed.response = cleanText(parsed?.response, 1200) || "BUSY understood the request.";
  parsed.actionLabel = cleanText(parsed?.actionLabel, 120) || "Continue";
  parsed.customerName = cleanText(parsed?.customerName, 240);
  parsed.service = cleanText(parsed?.service, 240);
  parsed.date = cleanText(parsed?.date, 20);
  parsed.time = cleanText(parsed?.time, 20);
  parsed.note = cleanText(parsed?.note, 900);
  parsed.value = Math.max(0, Number(parsed?.value) || 0);
  parsed.confidence = ["High", "Medium", "Low"].includes(parsed?.confidence)
    ? parsed.confidence
    : "Low";
  parsed.requiresConfirmation = ["create_booking", "complete_job"].includes(parsed.intent);

  return parsed;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return json(405, { error: "POST required" });

  try {
    const contentType = request.headers.get("content-type") || "";
    let transcript = "";
    let context: any = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const audio = form.get("audio");
      if (!(audio instanceof File)) {
        return json(400, { error: "Audio file is required." });
      }
      const rawContext = cleanText(form.get("context"), 80_000);
      context = rawContext ? JSON.parse(rawContext) : {};
      transcript = await transcribeAudio(audio);
    } else {
      const body: any = await request.json();
      transcript = cleanText(body?.text, 4000);
      context = body?.context || {};
    }

    if (!transcript) return json(400, { error: "Tell BUSY what you want to do." });
    const cleanedContext = safeContext(context);
    const command = await routeCommand(transcript, cleanedContext);

    return json(200, {
      transcript,
      command,
      backend: {
        commandModel: Deno.env.get("OPENAI_COMMAND_MODEL") || DEFAULT_COMMAND_MODEL,
        transcriptionModel: Deno.env.get("OPENAI_TRANSCRIBE_MODEL") || DEFAULT_TRANSCRIBE_MODEL,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Talk to BUSY failed.";
    console.error("BUSY command error:", message);
    return json(400, { error: message });
  }
});
