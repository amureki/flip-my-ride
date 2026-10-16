import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const { SITE_URL } = loadEnv(mode, ".", "");
  const site = SITE_URL ? new URL(SITE_URL) : null;
  if (site) {
    if (!['http:', 'https:'].includes(site.protocol))
      throw new Error("SITE_URL must be an HTTP or HTTPS URL.");
    site.search = "";
    site.hash = "";
    if (!site.pathname.endsWith("/")) site.pathname += "/";
  }
  return {
    base: "./",
    plugins: [{
      name: "site-metadata",
      transformIndexHtml() {
        if (!site) {
          console.warn("Set SITE_URL for absolute social preview and canonical URLs.");
          return [];
        }
        return [
          { tag: "link", attrs: { rel: "canonical", href: site.href }, injectTo: "head" as const },
          ...[
            ["og:url", site.href],
            ["og:image", new URL("og-image.png?v=2", site).href],
          ].map(([property, content]) => ({ tag: "meta", attrs: { property, content }, injectTo: "head-prepend" as const })),
          { tag: "meta", attrs: { name: "twitter:image", content: new URL("og-image.png?v=2", site).href }, injectTo: "head" as const },
        ];
      },
      generateBundle() {
        if (!site) return;
        this.emitFile({ type: "asset", fileName: "sitemap.xml", source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site.href.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</loc></url></urlset>\n` });
      },
    }],
  };
});
