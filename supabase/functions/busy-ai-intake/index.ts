const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-6-luna";
const MAX_SCREENSHOTS = 8;
const MAX_IMAGE_DATA_URL_CHARS = 7_000_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-busy-demo-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const CONFIDENCE = ["High", "Medium", "Low", "Not needed"];

const intakeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "order", "overlapCount", "warnings", "threads"],
  properties: {
    summary: { type: "string" },
    order: {
      type: "object",
      additionalProperties: false,
      required: ["confidence", "reason", "imageIds"],
      properties: {
        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
        reason: { type: "string" },
        imageIds: { type: "array", items: { type: "string" } },
      },
    },
    overlapCount: { type: "integer", minimum: 0 },
    warnings: { type: "array", items: { type: "string" } },
    threads: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id", "label", "sourceText", "imageIds", "parsed",
          "fieldConfidence", "warnings", "safeToAutoFile"
        ],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          sourceText: { type: "string" },
          imageIds: { type: "array", items: { type: "string" } },
          parsed: {
            type: "object",
            additionalProperties: false,
            required: [
              "stage", "name", "phone", "email", "address", "service",
              "date", "time", "value", "note", "confidence",
              "extractedFields", "dateDetected", "timeDetected",
              "valueDetected", "serviceDetected"
            ],
            properties: {
              stage: {
                type: "string",
                enum: ["Enquiry", "Quote sent", "Booking", "Completed job"],
              },
              name: { type: "string" },
              phone: { type: "string" },
              email: { type: "string" },
              address: { type: "string" },
              service: { type: "string" },
              date: { type: "string" },
              time: { type: "string" },
              value: { type: "string" },
              note: { type: "string" },
              confidence: { type: "string", enum: ["High", "Medium", "Low"] },
              extractedFields: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["name", "phone", "email", "address", "service", "date", "time", "value"],
                },
              },
              dateDetected: { type: "boolean" },
              timeDetected: { type: "boolean" },
              valueDetected: { type: "boolean" },
              serviceDetected: { type: "boolean" },
            },
          },
          fieldConfidence: {
            type: "object",
            additionalProperties: false,
            required: [
              "name", "contact", "phone", "email", "address",
              "service", "date", "time", "value", "stage"
            ],
            properties: Object.fromEntries(
              ["name", "contact", "phone", "email", "address", "service", "date", "time", "value", "stage"]
                .map((key) => [key, { type: "string", enum: CONFIDENCE }])
            ),
          },
          warnings: { type: "array", items: { type: "string" } },
          safeToAutoFile: { type: "boolean" },
        },
      },
    },
  },
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function normaliseText(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isDataImage(value: unknown) {
  return typeof value === "string" && /^data:image\/(png|jpe?g|webp);base64,/i.test(value);
}

function sanitizeRequest(body: any) {
  const screenshots = Array.isArray(body?.screenshots) ? body.screenshots : [];
  if (!screenshots.length || screenshots.length > MAX_SCREENSHOTS) {
    throw new Error(`Choose between 1 and ${MAX_SCREENSHOTS} screenshots.`);
  }

  const cleanedScreenshots = screenshots.map((shot: any, index: number) => {
    const dataUrl = String(shot?.dataUrl || "");
    if (!isDataImage(dataUrl)) throw new Error(`Screenshot ${index + 1} is not a supported image.`);
    if (dataUrl.length > MAX_IMAGE_DATA_URL_CHARS) {
      throw new Error(`Screenshot ${index + 1} is too large for intake analysis.`);
    }
    return {
      id: normaliseText(shot?.id, 180) || `image-${index + 1}`,
      order: Number.isFinite(Number(shot?.order)) ? Number(shot.order) : index + 1,
      fileName: normaliseText(shot?.fileName, 220),
      dataUrl,
    };
  });

  const services = (Array.isArray(body?.services) ? body.services : [])
    .slice(0, 30)
    .map((service: any) => ({ 
      id: normaliseText(service?.id, 100),
      name: normaliseText(service?.name, 160),
      value: Number.isFinite(Number(service?.value)) ? Number(service.value) : null,
    }))
    .filter((service: any) => service.name);

  return {
    appVersion: normaliseText(body?.appVersion, 30),
    source: normaliseText(body?.source, 120) || "Customer message",
    ownerText: normaliseText(body?.ownerText, 8000),
    today: normaliseText(body?.today, 20),
    currentOrder: Array.isArray(body?.currentOrder)
      ? body.currentOrder.map((id: unknown) => normaliseText(id, 180)).filter(Boolean)
      : cleanedScreenshots.map((shot: any) => shot.id),
    services,
    screenshots: cleanedScreenshots,
  };
}

function buildPrompt(input: any) {
  const serviceLines = input.services.length
    ? input.services.map((service: any) => `- ${service.name}`).join("\n")
    : "- No service list supplied";

  return `You are BUSY's intake analyst for a UK small service business.

Analyse the supplied screenshots as business evidence, not as creative content.

Your jobs:
1. Reconstruct the most likely chronological screenshot order. Use visible timestamps, message continuity, repeated/overlapping messages, reply context and UI chronology. Do not rely only on the upload order.
2. Detect overlapping/repeated messages across screenshots and count the overlaps that should be deduplicated.
3. Distinguish the customer from the business owner wherever the UI makes that possible. Do not attribute the owner's address/phone/words to the customer.
4. Decide whether the screenshots are one conversation/customer or multiple unrelated conversations. If multiple, return separate threads and assign each screenshot ID to the correct thread.
5. Extract only information that is actually supported. Never invent a customer name, address, date, service, value, phone number or email.
6. Use an exact service name from the supplied business service list only when the evidence clearly matches it. Otherwise leave service as an empty string and use Low confidence.
7. Normalise explicit dates to YYYY-MM-DD and explicit times to HH:MM. If a relative phrase such as "Friday" cannot be resolved confidently from visible context and today's date, leave the date empty.
8. Choose the lifecycle stage: Enquiry, Quote sent, Booking, or Completed job. A question about price is Enquiry unless the evidence shows a quote was actually sent. A proposed date is not a Booking unless acceptance/confirmation is evident.
9. sourceText should be a concise deduplicated transcription/summary of the relevant conversation evidence, preserving important wording and who said what. Do not repeat overlapping messages.
10. Confidence is evidence confidence, not stylistic confidence. Use High only for clearly visible/direct facts, Medium for a strong but not definitive interpretation, and Low when uncertain or missing.
11. safeToAutoFile must be false if there is any material ambiguity, mixed identity, uncertain service, uncertain customer contact, uncertain thread assignment, or contradictory evidence.

Business source label: ${input.source}
Today: ${input.today || "not supplied"}
Owner's optional text/context: ${input.ownerText || "(none)"}
Business services:
${serviceLines}

The screenshot IDs are identifiers only. Return them exactly in order.imageIds and each thread.imageIds.`;
}

function enforceServerSafety(result: any, input: any) {
  const validIds = new Set(input.screenshots.map((shot: any) => shot.id));
  const originalIds = input.screenshots.map((shot: any) => shot.id);
  const ordered = Array.isArray(result?.order?.imageIds)
    ? result.order.imageIds.filter((id: string) => validIds.has(id))
    : [];
  const completeOrder =
    ordered.length === originalIds.length &&
    new Set(ordered).size === originalIds.length;

  result.order = {
    confidence: ["High", "Medium", "Low"].includes(result?.order?.confidence)
      ? result.order.confidence
      : "Low",
    reason: normaliseText(result?.order?.reason, 1000),
    imageIds: completeOrder ? ordered : originalIds,
  };

  result.overlapCount = Math.max(0, Math.min(50, Number(result?.overlapCount) || 0));
  result.warnings = Array.isArray(result?.warnings)
    ? result.warnings.map((item: unknown) => normaliseText(item, 700)).filter(Boolean).slice(0, 12)
    : [];

  const multipleThreads = Array.isArray(result?.threads) && result.threads.length > 1;
  result.threads = (Array.isArray(result?.threads) ? result.threads : []).map((thread: any, index: number) => {
    const parsed = thread?.parsed || {};
    const confidence = thread?.fieldConfidence || {};
    const imageIds = (Array.isArray(thread?.imageIds) ? thread.imageIds : [])
      .filter((id: string) => validIds.has(id));

    const nameHigh = !!normaliseText(parsed.name, 240) && confidence.name === "High";
    const contactHigh =
      !!(normaliseText(parsed.phone, 100) || normaliseText(parsed.email, 240)) &&
      confidence.contact === "High";
    const serviceHigh = !!normaliseText(parsed.service, 240) && confidence.service === "High";
    const overallHigh = parsed.confidence === "High";
    const noWarnings = !Array.isArray(thread?.warnings) || thread.warnings.length === 0;

    return {
      ...thread,
      id: normaliseText(thread?.id, 180) || `thread-${index + 1}`,
      label: normaliseText(thread?.label, 300) || normaliseText(parsed.name, 240) || `Conversation ${index + 1}`,
      sourceText: normaliseText(thread?.sourceText, 12000),
      imageIds: imageIds.length ? imageIds : originalIds,
      parsed: {
        ...parsed,
        name: normaliseText(parsed.name, 240),
        phone: normaliseText(parsed.phone, 100),
        email: normaliseText(parsed.email, 240),
        address: normaliseText(parsed.address, 500),
        service: normaliseText(parsed.service, 240),
        date: normaliseText(parsed.date, 20),
        time: normaliseText(parsed.time, 20),
        value: normaliseText(parsed.value, 60),
        note: normaliseText(parsed.note, 12000),
      },
      warnings: Array.isArray(thread?.warnings)
        ? thread.warnings.map((item: unknown) => normaliseText(item, 700)).filter(Boolean).slice(0, 10)
        : [],
      safeToAutoFile:
        thread?.safeToAutoFile === true &&
        nameHigh &&
        contactHigh &&
        serviceHigh &&
        overallHigh &&
        noWarnings &&
        !multipleThreads &&
        result.order.confidence !== "Low",
    };
  });

  if (!result.threads.length) throw new Error("AI analysis returned no conversation threads.");
  result.summary = normaliseText(result?.summary, 800) ||
    (result.threads.length === 1 ? result.threads[0].label : `${result.threads.length} conversations detected`);

  return result;
}

async function analyseWithOpenAI(input: any) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const model = Deno.env.get("OPENAI_INTAKE_MODEL") || DEFAULT_MODEL;
  const userContent = [
    { type: "input_text", text: buildPrompt(input) },
    ...input.screenshots.map((shot: any) => ({ 
      type: "input_image",
      image_url: shot.dataUrl,
      detail: "high",
    })),
  ];

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      input: [{ role: "user", content: userContent }],
      text: {
        format: {
          type: "json_schema",
          name: "busy_intake_analysis",
          strict: true,
          schema: intakeSchema,
        },
      },
      max_output_tokens: 5000,
      store: false,
    }),
  });

  const payload: any = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI request failed with ${response.status}`;
    throw new Error(message);
  }

  const outputText = typeof payload?.output_text === "string"
    ? payload.output_text
    : (Array.isArray(payload?.output)
        ? payload.output
            .flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
            .filter((item: any) => item?.type === "output_text")
            .map((item: any) => item.text || "")
            .join("")
        : "");

  if (!outputText) throw new Error("OpenAI returned no structured intake output.");

  let parsed: any;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI returned intake output that could not be parsed.");
  }

  return enforceServerSafety(parsed, input);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return json(405, { error: "POST required" });

  try {
    const expectedToken = Deno.env.get("BUSY_DEMO_TOKEN");
    if (!expectedToken) {
      return json(503, {
        error: "BUSY_DEMO_TOKEN is not configured on the server.",
      });
    }
    const suppliedToken = request.headers.get("x-busy-demo-token") || "";
    if (suppliedToken !== expectedToken) {
      return json(401, { error: "Unauthorised BUSY prototype request." });
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > 45_000_000) {
      return json(413, { error: "Screenshot batch is too large." });
    }

    const body = await request.json();
    const input = sanitizeRequest(body);
    const analysis = await analyseWithOpenAI(input);

    return json(200, {
      ...analysis,
      backend: {
        provider: "OpenAI",
        model: Deno.env.get("OPENAI_INTAKE_MODEL") || DEFAULT_MODEL,
        appVersion: input.appVersion,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intake analysis failed.";
    console.error("BUSY intake error:", message);
    return json(400, { error: message });
  }
});
