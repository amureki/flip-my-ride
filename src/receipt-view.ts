import { levels } from "./levels.ts";
import { runTotal, licenceVerdict, meetsCleanPar, type RoundScore } from "./receipt.ts";

type ReceiptState = {
  rounds: readonly RoundScore[];
  levelIndex: number;
  final: boolean;
  hits: number;
  coneHat: boolean;
};

export function renderReceipt(
  { rounds, levelIndex, final, hits, coneHat }: ReceiptState,
  retryLevel: (index: number) => void,
) {
  const score = final ? runTotal(rounds) : rounds[levelIndex];
  document.querySelector("#receipt-progress")!.textContent = final ? `${levels.length}/${levels.length} lots cleared` : levels[levelIndex].name;
  document.querySelector("#receipt-flips")!.textContent = String(score.flips);
  document.querySelector("#receipt-claims")!.textContent = String(score.hits);
  const breakdown = document.querySelector<HTMLTableElement>("#receipt-levels")!;
  breakdown.hidden = !final;
  breakdown.tBodies[0].replaceChildren();
  if (final) rounds.forEach((round, i) => {
    const row = breakdown.tBodies[0].insertRow();
    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = `${i + 1}. ${levels[i].name}`;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Retry";
    retry.className = "retry-level";
    retry.setAttribute("aria-label", `Retry level ${i + 1}: ${levels[i].name}`);
    retry.addEventListener("click", () => {
      retryLevel(i);
    });
    row.append(name);
    row.insertCell().textContent = String(round.flips);
    row.insertCell().textContent = String(round.hits);
    const par = row.insertCell();
    par.textContent = meetsCleanPar(round, levels[i].par) ? "Earned" : "Missed";
    par.append(document.createElement("br"), `≤${levels[i].par} ${levels[i].par === 1 ? "flip" : "flips"}`);
    row.insertCell().append(retry);
  });
  const cleanPars = rounds.filter((round, i) => meetsCleanPar(round, levels[i].par)).length;
  document.querySelector("#receipt-par")!.textContent = final
    ? `${cleanPars}/${levels.length} clean pars earned`
    : meetsCleanPar(score, levels[levelIndex].par) ? "Clean par earned. Par-king perfection."
    : `Clean par: ≤${levels[levelIndex].par} flips, 0 claims. Retry for the badge.`;
  document.querySelector("#receipt-heading")!.textContent = final ? "Final receipt" : "Parking receipt";
  document.querySelector("#receipt-repairs")!.textContent = score.cars + score.trolleys + score.cones ? "We’ll be in touch." : "€0. Somehow.";
  document.querySelector("#result-title")!.textContent = final ? "Licence to Flip" : hits ? "Crash landing. Still parking." : "Parkour. But parked.";
  document.querySelector("#result-detail")!.textContent = final ? `${levels[levelIndex].parkedReply} ${licenceVerdict(score.hits)}`
    : score.cars ? "Cars flattened. Now that’s compact parking."
    : score.trolleys ? "Off your trolley. Into your spot."
    : score.cones ? "Cone-gratulations. You made an impression."
    : score.hits ? "A few claims to fame."
    : levels[levelIndex].parkedReply;
  document.querySelector("#result .receipt-footer")!.textContent = final && coneHat
    ? "All hail the Cone-queror. Long may you park."
    : "Thank you for parking with a twist.";
}
