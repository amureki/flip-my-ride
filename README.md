# Flip My Ride

A small browser game inspired by the Roadster stunt presentation. The car only moves by flipping. Land completely inside the green parking bay to win.

## Run locally

Requires Node.js 22.12+ (or a compatible newer release).

```sh
npm ci
npm run dev
```

Drag anywhere on the lot in the direction you want to jump. Drag farther for more power; the ring shows the landing point. Release to flip. On a keyboard, hold arrows or WASD to move the landing marker (combine direction keys for diagonals), then press Space to jump. Press R or Retry to reset, including during a jump.

Cones count as insurance claims. Landing on a parked car or outside the lot returns the player to the previous position. Flights can pass over obstacles. The car always finishes upright, facing the parking bay's direction.

## Lots

Play four lots in order: One Spot Over, Full Lot, Unexpected Item, and Last Space. Start with a short sideways flip, navigate parked cars, then time a landing around a runaway shopping trolley. Last Space combines a three-jump route through empty gaps with a trolley crossing the final approach. After parking, Next lot advances and Retry restarts the current lot. After Last Space, Play again returns to the first lot. Completed shares include the lot name.

## Static deployment

```sh
npm run build
npm run preview
```

Upload `dist/` to a static host. There is no backend, telemetry, account system, remote font request, or external asset service. Vite uses relative asset URLs, including for GitHub project subpaths.

### GitHub Pages

Push the repository to GitHub with a `main` branch. Select **Settings → Pages → Source → GitHub Actions**. The included `.github/workflows/deploy.yml` builds and deploys on pushes to `main`, or manually. Change the workflow branch if needed.

### Cloudflare Pages

Connect the repository. Use build command `npm run build`, output directory `dist`, and Node.js 22.12 or newer. No environment secrets or Functions are required.

### Link previews and icons

The public URL is https://flip.amureki.me/. `.env.production` sets `SITE_URL` for production builds. `public/CNAME` declares the GitHub Pages custom domain; configure the matching domain in the hosting settings and point its DNS record at the host. Override `SITE_URL` only when deploying to a different URL.

The build puts canonical and absolute Open Graph/X image URLs in the HTML and generates `sitemap.xml`. Without `SITE_URL`, local builds still work, but print a warning and omit these URL-dependent fields. Metadata does not depend on JavaScript execution.

`public/og-image.png` is the 1200 × 630 social card, generated with the built-in image generation tool using `assets/og-image-prompt.txt`. The favicon, Apple touch icon, and 192/512-pixel home-screen icons share the flipping-car mark in `public/favicon.svg`. Keep icon PNG exports in sync when editing that SVG. Social image and favicon URLs include a version tag; increase it when replacing these assets. The web manifest supports home-screen launch; it does not provide offline play.

After deployment, check a shared link in your target messaging/social apps and confirm that `og-image.png` is publicly reachable. Social platforms cache previews, so refresh their caches after changes. All shares use the same public game preview; completed scores are included in the post text.

## Implementation

Three.js draws a procedural low-poly scene. TypeScript manages deterministic jump arcs, pointer capture, collision checks at landing, and game state. Vite bundles the app. The interface uses system fonts. Mouse, touch, and pen share Pointer Events. The camera fits the lot to its container with ResizeObserver. Requires WebGL and a modern browser. Clipboard result sharing needs HTTPS or localhost; failure leaves a readable message.

The game uses simplified landing checks rather than rigid-body physics. It is an unofficial parody, not affiliated with Tesla.

Strong launches perform two rolls. A short launch crouch, visible air jets, landing bounce, and dust ring exaggerate each jump. The flip counter counts rotations; reduced-motion mode keeps the same controls and landing rules with a low arc and no rolls, jets, or landing bounce. The player car uses an original procedural wedge model with a dark canopy, slim light bars, rear wing, and four underside nozzles.

## Sharing

X, WhatsApp, Telegram, and the native share action are visible at the top from the first screen, and again in the completed result. Social links open a composer with the game URL and, after a win, a short score boast. No account or API key is needed. Users choose the recipient and send the post themselves.

The native action uses the device share sheet when available; otherwise it copies the game link, with manual selection if clipboard access fails. Cancelling native sharing does not copy anything. There are no score-bearing challenge URLs or download steps. Deploy to public HTTPS before sharing; localhost URLs only work on the same device.

Run local share URL and text checks with npm test.

In Unexpected Item, the trolley crosses the bay on a repeatable eight-second cycle. Only landing on it files a claim and returns the car to its previous position. Retry restarts the cycle.
