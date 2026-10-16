# Flip My Ride

A small browser game inspired by the Roadster stunt presentation. The car only moves by flipping. Land completely inside the green parking bay to win.

## Run locally

Requires Node.js 22.12+ (or a compatible newer release).

```sh
npm ci
npm run dev
```

On mobile, drag on the compact thumb pad at the bottom right (beside the lot in landscape) to aim, then release to flip. A short drag controls jump power while the landing marker stays visible above your hand. On desktop, drag anywhere on the lot in the direction you want to jump. Drag farther for more power; the ring shows the landing point. Release to flip. On a keyboard, hold arrows or WASD to move the landing marker (combine direction keys for diagonals), then press Space to jump. Press R or Retry to reset, including during a jump.

Land on cars, trolleys, or cones to flatten them and continue from the landing point. Each object adds one insurance claim the first time it is crushed. Wrecks remain until Retry or the next lot; landing on a wreck adds no further claim. Landing outside the lot still returns the player to the previous position. Flights can pass over obstacles. The car always finishes upright, facing the parking bay's direction.

## Lots

Play four lots in order: One Spot Over, Full Lot, Unexpected Item, and Last Space. Start with a short sideways flip, navigate parked cars, then time a landing around a runaway shopping trolley. Last Space combines a three-jump route through empty gaps with a trolley crossing the final approach. After parking, Next lot advances and Retry restarts the current lot. After Last Space, Play again returns to the first lot. Completed shares include the lot name.

## Static deployment

```sh
npm run build
npm run preview
```

Upload `dist/` to a static host. There is no backend, account system, remote font request, or external asset service. Vite uses relative asset URLs, including for GitHub project subpaths.

### Analytics

Umami loads from `https://t.rsts.me/script.js` only on the exact hostname `flip.amureki.me`. Local development, preview domains, and other hosts do not load the tracker.

To exclude your visits, open https://flip.amureki.me/ and run this in the DevTools console:

```js
localStorage.setItem('umami.disabled', '1');
location.reload();
```

Run this once in each browser profile and device. It excludes future visits; it does not remove visits already recorded. Clearing site data or using a new private session removes the exclusion. Browsers that block local storage are not tracked.

To enable tracking again, run `localStorage.removeItem('umami.disabled')` in the site's browser console and reload.

#### Game events

Events use [Umami's custom event API](https://docs.umami.is/docs/tracker-functions) and follow the same domain and DevTools opt-out rules as pageviews.

| Event | Meaning |
| --- | --- |
| `game_started` | First valid flip in a run; Play again starts a new run. |
| `level_started` | First valid flip in an attempt, including after Retry. |
| `level_completed` | Parking succeeds; includes damage counts. |
| `level_retried` | Retry after an attempt starts; `completed` separates replaying a cleared level from retrying an unfinished one. |
| `level_exit` | Page leaves during an unfinished attempt; best effort, not a reliable abandonment count. |
| `game_completed` | Final level cleared, once per run; includes totals for the saved level scores. |
| `share_clicked` | Sharing control used; includes method, header/result placement, and completion state. |
| `share_result` | Native share resolved/cancelled/failed, clipboard copied, or manual copy required. |
| `replay_started` | Recorded attempt playback requested. |
| `game_error` | WebGL initialization failed. |

Level events include the level number/name, attempt number, flips, claims, and visible gameplay seconds since the attempt's first flip. Duration excludes hidden-tab time, waiting before the first flip, and replay playback. Game totals use saved scores, not discarded retries. Playback does not emit starts or completions. Share results cannot confirm that a post was published or delivered; manual-copy fallback cannot confirm copying.

Compare level starts and completions by level in Umami, then inspect retries, duration, and claims for difficult sections. Use sessions/funnels for player progression: raw counts include repeat attempts. Compare pageviews with game starts for visitors who never play, and completions with share clicks for sharing interest. Exit events can be lost when browsers close; do not treat missing exit events as continued play. These signals show behavior, not whether players enjoyed a level.

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

The native action uses the device share sheet when available; otherwise it copies the game link, with manual selection if clipboard access fails. Cancelling native sharing does not copy anything. There are no score-bearing challenge URLs or shared replay links. Deploy to public HTTPS before sharing; localhost URLs only work on the same device.

Run local share URL and text checks with npm test.

## Replays

After each completed lot, Watch replay plays every jump since the latest Retry, including failed landings and crashes. Replays preserve the original jump timing, including pauses, with a two-second hold after the final landing. Watch replay keeps the normal gameplay size and camera, including when the window is resized. Replay uses the current reduced-motion preference.


Back to score, Escape, or hiding the tab stops playback and restores the completed score. Players can use their own screen recorder while watching. There is no built-in video export.

In Unexpected Item, the trolley crosses the bay on a repeatable eight-second cycle. Landing on it files one claim, flattens it, and stops it at the impact point. The player stays at the landing point. Retry restarts the cycle. Replay preserves trolley timing at each launch.
