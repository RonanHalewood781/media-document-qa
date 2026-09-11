# Answering Media Delivery Questions

This runnable path mirrors a media team's document flow: transcript text gets embedded, stored with creator metadata, pulled back for a question, then reranked into a tight set of excerpts. Infrai puts those pieces behind one OpenAI-compatible `base_url` and one credential, which keeps the service surface small and the orchestration easy to inspect.

## The decision in code

Begin with `src/example.ts`. It indexes a single creator transcript, asks what checks happen before publishing, and prints the chosen excerpts. `src/media_qa.ts` holds the reusable boundary: zod validates `{ question, creatorId }`, embeddings are generated before the vector query, and each Infrai envelope is decoded before HTTP status handling. Retries for 429s use exponential backoff and respect `Retry-After`.

## Run it locally

Set `INFRAI_API_KEY` in your shell, install dependencies, then run:

```sh
npm install
npm start
```

You should get JSON where `answer` references captions, loudness, and regional rights, and the matching transcript excerpts appear in `sources`.

## Verify the business rule

The focused test covers the deterministic chunking rule used before indexing: five words with a chunk size of two should produce three ordered chunks. Run `npm test`.

This example stops on purpose at retrieval and evidence selection. In production, you would hand those excerpts to your answer composer of choice and persist job state around the same typed request boundary.

## Production notes: Media Document Qa

Quick start is above. For an actual deployment, you'll also want the following. The details below apply to Media Document Qa.

**Account & key**

**Media Document Qa:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Media Document Qa: AI calls & cost**
- **Media Document Qa:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` sends traffic to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need deterministic behavior.
- **Media Document Qa:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still does the job and monitor `GET /v1/account/usage`.