const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-6-luna";
const MAX_PHOTOS = 6;
const MAX_IMAGE_DATA_URL_CHARS = 7_000_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const socialSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "detectedService",
    "story",
    "privacyWarnings",
    "captions"
  ],
  properties: {
    summary: { type: "string" },
    detectedService: { type: "string" },
    story: {
      type: "object",
      additionalProperties: false,
      required: [
        "type",
        "confidence",
        "beforeImageId",
        "afterImageId",
        "reason"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "before_after",
            "finished_result",
            "process",
            "equipment",
            "general",
            "unclear"
          ]
        },
        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
        beforeImageId: { type: "string" },
        afterImageId: { type: "string" },
        reason: { type: "string" }
      }
    },
    privacyWarnings: {
      type: "array",
      items: { type: "string" },
      maxItems: 8
    },
    captions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "label",
          "tone",
          "text",
          "recommendedChannels",
          "reason"
        ],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          tone: { type: "string" },
          text: { type: "string" },
          recommendedChannels: {
            type: "array",
            items: {
              type: "string",
              enum: ["Facebook", "Instagram", "Google Business"]
            }
          },
          reason: { type: "string" }
        }
      }
    }
  }
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function cleanText(value: unknown, max = 3000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isDataImage(value: unknown) {
  return typeof value === "string" &&
    /^data:image\/(png|jpe?g|webp);base64,/i.test(value);
}

function sanitizeRequest(body: any) {
  const photos = Array.isArray(body?.photos) ? body.photos : [];
  if (!photos.length || photos.length > MAX_PHOTOS) {
    throw new Error(`Choose between 1 and ${MAX_PHOTOS} photos.`);
  }

  const cleanPhotos = photos.map((photo: any, index: number) => {
    const dataUrl = String(photo?.dataUrl || "");
    if (!isDataImage(dataUrl)) {
      throw new Error(`Photo ${index + 1} is not a supported image.`);
    }
    if (dataUrl.length > MAX_IMAGE_DATA_URL_CHARS) {
      throw new Error(`Photo ${index + 1} is too large.`);
    }
    return {
      id: cleanText(photo?.id, 180) || `photo-${index + 1}`,
      fileName: cleanText(photo?.fileName, 220),
      dataUrl
    };
  });

  const services = (Array.isArray(body?.services) ? body.services : [])
    .slice(0, 30)
    .map((service: any) => ({
      name: cleanText(service?.name, 180),
      description: cleanText(service?.description, 700),
    }))
    .filter((service: any) => service.name);
  const ownerRules = (Array.isArray(body?.ownerRules) ? body.ownerRules : [])
    .slice(0, 30)
    .map((rule: unknown) => cleanText(rule, 500))
    .filter(Boolean);

  return {
    appVersion: cleanText(body?.appVersion, 30),
    businessName: cleanText(body?.businessName, 180),
    trade: cleanText(body?.trade, 180),
    source: cleanText(body?.source, 120) || "Selected photos",
    serviceHint: cleanText(body?.serviceHint, 180),
    brief: cleanText(body?.brief, 1800),
    services,
    brandIdentity:
      body?.brandIdentity && typeof body.brandIdentity === "object"
        ? {
            tagline: cleanText(body.brandIdentity.tagline, 300),
            publicDescription: cleanText(body.brandIdentity.publicDescription, 1200),
            serviceAreaText: cleanText(body.brandIdentity.serviceAreaText, 500),
            toneOfVoice: cleanText(body.brandIdentity.toneOfVoice, 200),
            visualStyle: cleanText(body.brandIdentity.visualStyle, 200),
            differentiators: cleanText(body.brandIdentity.differentiators, 1200),
          }
        : null,
    ownerRules,
    photos: cleanPhotos
  };
}

function buildPrompt(input: any) {
  const services = input.services.length
    ? input.services
        .map((service: any) =>
          service.description
            ? `- ${service.name}: ${service.description}`
            : `- ${service.name}`
        )
        .join("\n")
    : "- No service list supplied";
  const brandIdentity = input.brandIdentity
    ? [
        input.brandIdentity.tagline ? `Tagline: ${input.brandIdentity.tagline}` : "",
        input.brandIdentity.publicDescription
          ? `Public description: ${input.brandIdentity.publicDescription}`
          : "",
        input.brandIdentity.serviceAreaText
          ? `Service area wording: ${input.brandIdentity.serviceAreaText}`
          : "",
        input.brandIdentity.toneOfVoice
          ? `Tone of voice: ${input.brandIdentity.toneOfVoice}`
          : "",
        input.brandIdentity.visualStyle
          ? `Visual direction: ${input.brandIdentity.visualStyle}`
          : "",
        input.brandIdentity.differentiators
          ? `Recorded differentiators: ${input.brandIdentity.differentiators}`
          : "",
      ].filter(Boolean).join("\n")
    : "";
  const ownerRules = input.ownerRules.length
    ? input.ownerRules.map((rule: string) => `- ${rule}`).join("\n")
    : "- No owner rules saved";

  return `You are BUSY, a practical social-content assistant for a UK small service business.

Analyse only the photos deliberately supplied by the owner. The job is to create useful, truthful organic social content from real work — not generic marketing waffle.

Business: ${input.businessName || "Small business"}
Trade: ${input.trade || "Service business"}
Source: ${input.source}
Known service hint: ${input.serviceHint || "(none)"}
Owner brief: ${input.brief || "(none)"}
Known services:
${services}

Recorded Brand Brain identity (use only what is present; never fill blanks with guesses):
${brandIdentity || "- No additional brand identity saved"}

Owner-set Business Brain rules (highest authority for this content task):
${ownerRules}

Rules:
1. Respect every owner-set Business Brain rule above unless it conflicts with safety or the supplied evidence.
2. Work out what the photos actually show. If they appear to form a before/after pair, identify the before and after image IDs. Do not force a before/after interpretation when the evidence is weak.
3. detectedService may use an exact service name from the supplied service list when the photos/context clearly support it. Otherwise return the supplied service hint if appropriate, or an empty string.
4. Never identify people, infer a customer's name, reproduce a visible home address, phone number, email, registration plate, invoice number or other private identifier in a caption.
5. If a person, readable registration plate, house number/address, document, screen or other potentially private detail is visible, add a short privacy warning so the owner can check it before publishing.
6. Do not invent results, prices, discounts, guarantees, review quotes, locations, customer reactions or claims that are not supported.
7. Produce exactly three genuinely different caption options:
   - one straightforward/local-business option,
   - one concise/results-led option,
   - one warmer/conversational option.
8. Keep UK English natural and useful. When a Brand Brain tone of voice is recorded, use it as the default writing style without copying the wording mechanically. Avoid excessive hashtags, emojis, hype, "game-changer", "transform your space", and other generic AI-marketing language.
9. Captions should work without exposing customer identity. A simple call to message the business for a quote is fine.
10. Recommend only Facebook, Instagram and/or Google Business, and explain briefly why each caption suits those channels.
11. This is organic content. Do not suggest paid spend.

Return only the structured result.`;
}

function enforceSafety(result: any, input: any) {
  const validIds = new Set(input.photos.map((photo: any) => photo.id));
  const story = result?.story || {};
  const beforeImageId = validIds.has(story.beforeImageId) ? story.beforeImageId : "";
  const afterImageId = validIds.has(story.afterImageId) ? story.afterImageId : "";
  const type =
    ["before_after", "finished_result", "process", "equipment", "general", "unclear"]
      .includes(story.type)
      ? story.type
      : "unclear";

  const captions = (Array.isArray(result?.captions) ? result.captions : [])
    .slice(0, 3)
    .map((caption: any, index: number) => ({
      id: cleanText(caption?.id, 80) || `caption-${index + 1}`,
      label: cleanText(caption?.label, 120) || `Option ${index + 1}`,
      tone: cleanText(caption?.tone, 120),
      text: cleanText(caption?.text, 2200),
      recommendedChannels: (Array.isArray(caption?.recommendedChannels)
        ? caption.recommendedChannels
        : []
      ).filter((channel: string) =>
        ["Facebook", "Instagram", "Google Business"].includes(channel)
      ),
      reason: cleanText(caption?.reason, 600)
    }))
    .filter((caption: any) => caption.text);

  if (captions.length !== 3) {
    throw new Error("AI did not return three usable caption options.");
  }

  return {
    summary: cleanText(result?.summary, 700),
    detectedService: cleanText(result?.detectedService, 180),
    story: {
      type,
      confidence: ["High", "Medium", "Low"].includes(story.confidence)
        ? story.confidence
        : "Low",
      beforeImageId,
      afterImageId,
      reason: cleanText(story.reason, 700)
    },
    privacyWarnings: (Array.isArray(result?.privacyWarnings)
      ? result.privacyWarnings
      : []
    ).map((warning: unknown) => cleanText(warning, 500)).filter(Boolean).slice(0, 8),
    captions
  };
}

async function createContent(input: any) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const model = Deno.env.get("OPENAI_SOCIAL_MODEL") ||
    Deno.env.get("OPENAI_INTAKE_MODEL") ||
    DEFAULT_MODEL;

  const content = [
    { type: "input_text", text: buildPrompt(input) },
    ...input.photos.map((photo: any) => ({
      type: "input_image",
      image_url: photo.dataUrl,
      detail: "high"
    }))
  ];

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name: "busy_social_content",
          strict: true,
          schema: socialSchema
        }
      },
      max_output_tokens: 4200,
      store: false
    })
  });

  const payload: any = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `OpenAI request failed with ${response.status}`);
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

  if (!outputText) throw new Error("OpenAI returned no structured social-content output.");

  let parsed: any;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI returned social-content output that could not be parsed.");
  }

  return {
    ...enforceSafety(parsed, input),
    backend: { provider: "OpenAI", model }
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "POST required" });

  try {
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    const allowedKeys = Object.values(publishableKeys).filter(
      (value): value is string => typeof value === "string" && value.length > 0
    );
    const suppliedKey = request.headers.get("apikey") || "";
    if (!suppliedKey || !allowedKeys.includes(suppliedKey)) {
      return json(401, { error: "Unauthorised BUSY prototype request." });
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > 35_000_000) {
      return json(413, { error: "Photo batch is too large." });
    }

    const body = await request.json();
    const input = sanitizeRequest(body);
    const result = await createContent(input);
    return json(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social-content analysis failed.";
    console.error("BUSY social-content error:", message);
    return json(400, { error: message });
  }
});
