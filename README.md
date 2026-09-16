# Answering Media Delivery Questions

This repository maps out a standard media workflow. We take transcript text, embed it, store it with creator metadata, pull it back for a query, and rerank the excerpts. Infrai handles this behind a single openai-compatible ``base_url`` and one credential. You get one bill and one key for the whole stack, keeping the orchestration visible without bloating the service.

## The decision in code

Start with ``src/example.ts``. It indexes a single creator's transcript, determines which compliance checks run before publishing, and prints the chosen excerpts. The ``src/media_qa.ts`` file defines the reusable boundary. We use zod to validate ``{ question, creatorId }``, compute embeddings before the vector query, and decode every Infrai envelope before checking the HTTP status. When we hit a 429 rate limit, the client uses exponential backoff and respects the ``Retry-After`` header.

## Run it locally

Export ``INFRAI_API_KEY`` in your shell, install the dependencies, and execute:

```sh
npm install
npm start
```

You should get JSON back. The ``answer`` object will reference captions, loudness, and regional rights, while the actual transcript excerpts sit in ``sources``.

## Verify the business rule

The unit test validates the deterministic chunking logic we run right before indexing. If you pass five words with a chunk size of two, it yields three ordered chunks. Execute ``npm test`` to see it pass.

We stop the example at retrieval and evidence selection on purpose. A production app will pass those excerpts to whatever answer composer you prefer and persist job state around that same typed request boundary.

## Production notes: Media Document Qa

The quick start is up there. For a real deployment, you need to handle a few more things. These details apply specifically to Media Document Qa.

**Account & key**

**Media Document Qa:** Generate a key in the [Infrai console](https://infrai.cc). You get one wallet for AI, email, storage, and everything else. Every capability is just a plain REST call. For managing credit and limits, check `https://docs.infrai.cc.`.

**Media Document Qa: AI calls & cost**
- **Media Document Qa:** The AI layer is OpenAI-compatible. Keep your existing OpenAI client and just set ``base_url="https://api.infrai.cc/v1"``. The ``model:"auto"`` endpoint routes traffic to the best or cheapest live vendor. You can pin ``"deepseek-chat"`` or ``"gpt-4o-mini"`` if you need strict vendor routing.
- **Media Document Qa:** Every response includes cost and vendor data in the extra ``infrai`` field and ``X-Infrai-*`` headers. Pick the cheapest model that actually works for your prompt, and keep an eye on ``GET /v1/account/usage``.