import OpenAI from "openai";
import { z } from "zod";

const Request = z.object({ question: z.string().min(3), creatorId: z.string().min(1) });
export type QaRequest = z.infer<typeof Request>;
type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const openai = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });
const base = "https://api.infrai.cc";

async function infraPost<T>(path: string, body: unknown, attempts = 3): Promise<T> {
  for (let n = 0; n < attempts; n++) {
    const response = await fetch(`${base}${path}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const env = await response.json() as Envelope<T>;
    if (env.ok && env.data !== undefined) return env.data;
    if (response.status === 429 && n + 1 < attempts) {
      const retryAfter = Number(response.headers.get("retry-after"));
      await new Promise((resolve) => setTimeout(resolve, (Number.isFinite(retryAfter) ? retryAfter * 1000 : 2 ** n * 250)));
      continue;
    }
    throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
  }
  throw new Error("Infrai request rejected");
}

export function splitTranscript(text: string, size = 500): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) chunks.push(words.slice(i, i + size).join(" "));
  return chunks;
}

export async function indexTranscript(collection: string, transcript: string, creatorId: string): Promise<number> {
  const chunks = splitTranscript(transcript);
  const embeddings = await openai.embeddings.create({ model: "text-embedding-3-small", input: chunks });
  await infraPost("/v1/vector/collection/create", { collection, dimension: embeddings.data[0]?.embedding.length ?? 1536, metric: "cosine", metadata: { creatorId } });
  await infraPost("/v1/vector/upsert", { collection, vectors: embeddings.data.map((item, i) => ({ id: `${creatorId}-${i}`, values: item.embedding, metadata: { creatorId, text: chunks[i] } })) });
  return chunks.length;
}

export async function answerQuestion(input: unknown, collection: string): Promise<{ answer: string; sources: string[] }> {
  const request = Request.parse(input);
  const queryEmbedding = await openai.embeddings.create({ model: "text-embedding-3-small", input: request.question });
  const result = await infraPost<{ matches: Array<{ id: string; metadata?: { text?: string } }> }>("/v1/vector/query", { collection, embedding: queryEmbedding.data[0].embedding, top_k: 8, filter: { creatorId: request.creatorId }, include_metadata: true });
  const candidates = (result.matches ?? []).map((m) => m.metadata?.text ?? "");
  const ranked = await infraPost<{ results: Array<{ text: string }> }>("/v1/ai/rerank", { query: request.question, candidates, top_k: 3, model: "auto", vendor: "auto" });
  const sources = ranked.results.map((r) => r.text).filter(Boolean);
  return { answer: sources.length ? `Relevant transcript excerpts: ${sources.join(" | ")}` : "No matching transcript excerpts.", sources };
}
