import { strict as assert } from "node:assert";
import { getClientQuoteActions } from "./quote-actions.ts";

assert.deepEqual(
  getClientQuoteActions("Brouillon"),
  ["edit", "preview", "download", "link", "send"],
);
assert.deepEqual(getClientQuoteActions("Signé"), ["preview", "download", "link"]);
