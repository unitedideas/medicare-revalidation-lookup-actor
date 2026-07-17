import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

test("actor is bounded, secret-free, and uses a customer-funded result contract", async () => {
  const actor = await readJson("../.actor/actor.json");
  const input = await readJson("../.actor/input_schema.json");
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.equal(actor.usesStandbyMode, false);
  assert.equal(actor.defaultMemoryMbytes, 128);
  assert.equal(input.properties.npis.maxItems, 100);
  assert.match(source, /Actor\.pushData\(result\.items, "revalidation-result"\)/);
  assert.doesNotMatch(source, /process\.env\.(?:TOKEN|SECRET|PASSWORD|API_KEY)/);
  assert.match(readme, /platform usage is paid by the Actor user/i);
  assert.match(readme, /does not show live PECOS/i);
});
