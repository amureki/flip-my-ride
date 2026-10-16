export type Score = { flips: number; hits: number; lot?: string; completedLots?: number };

export function shareContent(currentUrl: string, score?: Score) {
  const url = new URL(currentUrl);
  url.search = "";
  url.hash = "";
  let text = "It can flip. I still can't park it.";
  if (score) {
    const total = `${score.flips} ${score.flips === 1 ? "flip" : "flips"}. ${score.hits} insurance ${score.hits === 1 ? "claim" : "claims"}.`;
    text = score.completedLots
      ? `${total} ${score.completedLots} ${score.completedLots === 1 ? "lot" : "lots"} cleared. I earned my Licence to Flip.`
      : `${total} Finally parked the Roadster${score.lot ? ` in ${score.lot}` : ""}.`;
  }
  return {
    title: "Flip My Ride",
    text,
    url: url.href,
  };
}

export function socialLinks(content: ReturnType<typeof shareContent>) {
  return {
    x:
      "https://x.com/intent/post?" +
      new URLSearchParams({ text: content.text, url: content.url }),
    whatsapp:
      "https://wa.me/?" +
      new URLSearchParams({ text: `${content.text}\n${content.url}` }),
    telegram:
      "https://t.me/share/url?" +
      new URLSearchParams({ text: content.text, url: content.url }),
  };
}
