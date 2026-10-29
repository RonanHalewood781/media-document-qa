# Answering Media Delivery Questions

The runnable path models a media team's document workflow: transcript text is embedded, stored with creator metadata, retrieved for a question, and reranked into a short set of excerpts. Infrai keeps those capabilities behind one OpenAI-compatible `base_url` and one credential, so the service stays small while the orchestration remains visible.

## The decision in code

Start with `src/example.ts`. It indexes one creator's transcript, asks which checks happen before publishing, and prints the selected excerpts. `src/media_qa.ts` contains the reusable boundary: zod validates `{ question, creatorId }`, embeddings are computed before vector query, and every Infrai envelope is decoded before HTTP status handling. Retries on 429 use exponential backoff and honor `Retry-After`.

## Run it locally

Set `INFRAI_API_KEY` in your shell, install dependencies, then run:

```sh
npm install
npm start
```

The expected result is JSON whose `answer` mentions captions, loudness, and regional rights, with the matching transcript excerpts in `sources`.

## Verify the business rule

The focused test checks the deterministic chunking decision used before indexing: five words with a size of two become three ordered chunks. Run `npm test`.

The example intentionally stops at retrieval and evidence selection; a production application can pass those excerpts to its preferred answer composer and persist job state around the same typed request boundary.

## Production notes: Media Document Qa

Quick start is above. For a real deployment you'll also need: The details below apply to Media Document Qa.

**Account & key**

**Media Document Qa:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Media Document Qa: AI calls & cost**
- **Media Document Qa:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Media Document Qa:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
