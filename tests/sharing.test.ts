import { test } from "node:test";
import assert from "node:assert/strict";
import { shareContent, socialLinks } from "../src/sharing.ts";

test("share URL preserves static-host path without challenge or tracking state", () => {
  const content = shareContent(
    "https://example.com/tesla-flips/?tracking=1#flips=3&hits=1",
  );
  assert.equal(content.url, "https://example.com/tesla-flips/");
  assert.match(content.text, /Roadster only does flips/);
});
test("a completed run shares a boast with correct singular and plural", () => {
  assert.match(
    shareContent("https://example.com", { flips: 1, hits: 1 }).text,
    /1 flip and 1 insurance claim/,
  );
  assert.match(
    shareContent("https://example.com", { flips: 3, hits: 0 }).text,
    /3 flips and 0 insurance claims/,
  );
});
test("social composers receive encoded game URL and score text", () => {
  const content = shareContent("https://example.com/my-game/", {
    flips: 3,
    hits: 1,
  });
  const links = socialLinks(content);
  assert.equal(new URL(links.x).searchParams.get("text"), content.text);
  assert.equal(new URL(links.x).searchParams.get("url"), content.url);
  assert.equal(
    new URL(links.whatsapp).searchParams.get("text"),
    content.text + "\n" + content.url,
  );
  assert.equal(new URL(links.telegram).searchParams.get("text"), content.text);
  assert.equal(new URL(links.telegram).searchParams.get("url"), content.url);
});
