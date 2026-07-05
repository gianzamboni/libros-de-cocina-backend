import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared mock for the Anthropic client's messages.create, hoisted so it can be
// referenced inside the vi.mock factory below.
const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));

import { scanIndex } from "../../src/modules/scan/scan.service.js";

const buffer = Buffer.from("fake-image-bytes");

function respondWith(text: string) {
  create.mockResolvedValue({ content: [{ type: "text", text }] });
}

beforeEach(() => {
  create.mockReset();
});

describe("scanIndex", () => {
  it("parses a clean JSON array", async () => {
    respondWith('[{"name": "Tarta", "page": 12}]');
    await expect(scanIndex(buffer, "image/png")).resolves.toEqual([
      { name: "Tarta", page: 12 },
    ]);
  });

  it("strips markdown code fences before parsing", async () => {
    respondWith('```json\n[{"name": "Pan", "page": 5}]\n```');
    await expect(scanIndex(buffer, "image/jpeg")).resolves.toEqual([
      { name: "Pan", page: 5 },
    ]);
  });

  it("trims names, truncates float pages, and filters invalid entries", async () => {
    respondWith(
      '[{"name": "  Sopa  ", "page": 7.9}, {"name": "Bad", "page": -3}, {"name": "", "page": 4}]',
    );
    await expect(scanIndex(buffer, "image/webp")).resolves.toEqual([
      { name: "Sopa", page: 7 },
    ]);
  });

  it("rejects an unsupported mime type with a 400", async () => {
    await expect(scanIndex(buffer, "application/pdf")).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 502 when the response has no JSON array brackets", async () => {
    respondWith("Sorry, I could not read the image.");
    await expect(scanIndex(buffer, "image/png")).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it("returns 502 when the bracketed content is malformed JSON", async () => {
    respondWith("[not, valid, json]");
    await expect(scanIndex(buffer, "image/png")).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});
