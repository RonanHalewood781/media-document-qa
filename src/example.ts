import { indexTranscript, answerQuestion } from "./media_qa.js";

const collection = "creator-delivery-demo";
const transcript = "Episode 12 reviews the launch checklist. The delivery team confirms captions, loudness, and regional rights before publishing. A creator receives a signed review link after processing completes.";
await indexTranscript(collection, transcript, "creator-17");
const output = await answerQuestion({ question: "What must the team confirm before publishing?", creatorId: "creator-17" }, collection);
console.log(JSON.stringify(output, null, 2));
