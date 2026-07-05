import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env.js";
import { badRequest, HttpError } from "../../utils/httpError.js";

const SYSTEM_PROMPT =
  "You are a recipe index parser. Extract every recipe name and its page " +
  'number. Return ONLY a JSON array like: [{"name": "Recipe Name", "page": 42}].';

type ScanMediaType = "image/jpeg" | "image/png" | "image/webp";

const SUPPORTED: Record<string, ScanMediaType> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

export interface ScannedRecipe {
  name: string;
  page: number;
}

const client = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

/**
 * Sends an index photo to Claude vision and returns the extracted
 * [{name, page}] list. Does not persist anything — the client confirms the
 * result and then calls the bulk-create endpoint.
 */
export async function scanIndex(
  buffer: Buffer,
  mimeType: string,
): Promise<ScannedRecipe[]> {
  if (!client) {
    throw new HttpError(503, "Index scanning is not configured on the server");
  }

  const mediaType = SUPPORTED[mimeType];
  if (!mediaType) {
    throw badRequest(
      `Unsupported image type for scanning: ${mimeType}. Use JPEG, PNG, or WebP.`,
    );
  }

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: buffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: "Extract the recipe index from this image.",
          },
        ],
      },
    ],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return parseRecipes(text);
}

/** Tolerantly parses Claude's response into a validated recipe list. */
function parseRecipes(text: string): ScannedRecipe[] {
  // Strip markdown fences if the model wrapped the JSON.
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new HttpError(502, "Scanner returned an unexpected response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new HttpError(502, "Scanner returned malformed JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new HttpError(502, "Scanner returned malformed JSON");
  }

  return parsed
    .filter(
      (item): item is { name: string; page: number } =>
        !!item &&
        typeof item === "object" &&
        typeof (item as { name?: unknown }).name === "string" &&
        Number.isFinite((item as { page?: unknown }).page),
    )
    .map((item) => ({ name: item.name.trim(), page: Math.trunc(item.page) }))
    .filter((item) => item.name.length > 0 && item.page > 0);
}
