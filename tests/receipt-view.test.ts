import test from "node:test";
import assert from "node:assert/strict";
import { levels } from "../src/levels.ts";
import { renderReceipt } from "../src/receipt-view.ts";

test("receipts retain round scores, clean pars, final totals, and the cone-hat ending", () => {
  const elements = new Map();
  const rows = [];
  const table = {
    hidden: true,
    tBodies: [{
      replaceChildren() { rows.length = 0; },
      insertRow() {
        const cells = [];
        rows.push(cells);
        return {
          append(node) { cells.push(node); },
          insertCell() {
            const cell = { textContent: "", append() {} };
            cells.push(cell);
            return cell;
          },
        };
      },
    }],
  };
  const previousDocument = globalThis.document;
  globalThis.document = {
    querySelector(selector) {
      if (selector === "#receipt-levels") return table;
      if (!elements.has(selector)) elements.set(selector, {textContent: ""});
      return elements.get(selector);
    },
    createElement() { return {setAttribute() {}, addEventListener() {}}; },
  };
  const rounds = levels.map(() => ({flips: 1, hits: 0, cars: 0, trolleys: 0, cones: 0}));
  try {
    renderReceipt({rounds, levelIndex: 6, final: true, hits: 0, coneHat: true}, () => {});
    assert.equal(elements.get("#receipt-flips").textContent, "7");
    assert.equal(elements.get("#receipt-claims").textContent, "0");
    assert.equal(elements.get("#receipt-par").textContent, "7/7 clean pars earned");
    assert.match(elements.get("#result .receipt-footer").textContent, /Cone-queror/);
    assert.equal(table.hidden, false);
    assert.equal(rows.length, 7);
    assert.equal(rows[0][3].textContent, "Earned");

    rounds[0] = {flips: 3, hits: 1, cars: 1, trolleys: 0, cones: 0};
    renderReceipt({rounds, levelIndex: 0, final: false, hits: 1, coneHat: false}, () => {});
    assert.equal(elements.get("#receipt-flips").textContent, "3");
    assert.equal(elements.get("#receipt-claims").textContent, "1");
    assert.match(elements.get("#receipt-par").textContent, /Retry for the badge/);
    assert.match(elements.get("#result-detail").textContent, /compact parking/);
    assert.equal(table.hidden, true);
    assert.equal(rows.length, 0);
  } finally {
    globalThis.document = previousDocument;
  }
});
