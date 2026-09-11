import assert from "node:assert/strict";
import { splitTranscript } from "../src/media_qa.js";

const chunks = splitTranscript("one two three four five", 2);
assert.deepEqual(chunks, ["one two", "three four", "five"]);
console.log("splitTranscript preserves ordered, bounded chunks");
