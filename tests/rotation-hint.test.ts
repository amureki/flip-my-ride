import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const setup = source.slice(source.indexOf('const portrait ='), source.indexOf('let pointerSurface:'));

function fixture(saved = false, blocked = false, touch = true) {
  const hint = { hidden: true };
  const portrait = { matches: true, addEventListener() {} };
  let dismiss = () => {};
  let stored = saved;
  const context = vm.createContext({
    matchMedia: () => portrait,
    mobileControls: { matches: touch, addEventListener() {} },
    document: { querySelector: (selector: string) => selector === '#rotation-hint' ? hint : { addEventListener: (_: string, fn: () => void) => { dismiss = fn; } } },
    localStorage: {
      getItem() { if (blocked) throw new Error('Unavailable'); return stored ? '1' : null; },
      setItem() { if (blocked) throw new Error('Unavailable'); stored = true; },
    },
  });
  vm.runInContext(ts.transpile(setup), context);
  return { hint, portrait, context, dismiss: () => dismiss(), stored: () => stored };
}

test('rotation hint appears only for new portrait touch players', () => {
  assert.equal(fixture().hint.hidden, false);
  assert.equal(fixture(true).hint.hidden, true);
  assert.equal(fixture(false, false, false).hint.hidden, true);
});

test('dismissal and rotation permanently hide the hint', () => {
  const dismissed = fixture();
  dismissed.dismiss();
  assert.equal(dismissed.hint.hidden, true);
  assert.equal(dismissed.stored(), true);
  const rotated = fixture();
  rotated.portrait.matches = false;
  vm.runInContext('updateRotationHint()', rotated.context);
  rotated.portrait.matches = true;
  vm.runInContext('updateRotationHint()', rotated.context);
  assert.equal(rotated.hint.hidden, true);
  assert.equal(rotated.stored(), true);
});

test('hint can be dismissed when storage is unavailable', () => {
  const state = fixture(false, true);
  state.dismiss();
  vm.runInContext('updateRotationHint()', state.context);
  assert.equal(state.hint.hidden, true);
});
