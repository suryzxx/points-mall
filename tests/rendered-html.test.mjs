import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds a GitHub Pages compatible static shell", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

  assert.match(html, /<title>积分商城 MVP 原型<\/title>/i);
  assert.match(html, /<div id="root"><\/div>/i);
  assert.match(html, /type="module"/i);
  assert.match(html, /\.\/assets\//i);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/);
});
