export type Score = { flips: number; hits: number };

export function shareContent(currentUrl: string, score?: Score) {
  const url = new URL(currentUrl);
  url.search = "";
  url.hash = "";
  return {
    title: "Just Park It",
    text: score
      ? `It took me ${score.flips} ${score.flips === 1 ? "flip" : "flips"} and ${score.hits} insurance ${score.hits === 1 ? "claim" : "claims"} to park a car. Beat that.`
      : "Someone made a parking game where the Roadster only does flips. Good luck.",
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
