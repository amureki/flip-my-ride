# Flip My Ride

A small browser game inspired by the Roadster stunt presentation. The car only moves by flipping. Land completely inside the green parking bay to win, even on top of another car.

https://github.com/user-attachments/assets/7d19fc0a-8917-45ea-b795-10ed1529a121

[Play the game](https://flip.amureki.me/)

## Run locally

Requires Node.js 22.12 or a compatible newer release.

```sh
npm ci
npm run dev
```

## Controls

On mobile, drag on the thumb pad to aim, then release to flip. The pad sits at the bottom center in portrait and beside the lot in landscape. Small drags provide fine aiming; drag farther, including beyond the pad, for more power. The landing marker stays visible above your hand. Releasing uses the last visible preview, even if your finger moves as you lift it. Slide back to where you started the touch to cancel.

On desktop, click a landing spot to flip there. Hold the mouse or trackpad button and move to adjust the landing ring before releasing. Targets beyond the nine-unit range are clamped to the nearest reachable point. Press Escape to cancel.

On a keyboard, hold arrows or WASD to move the landing marker, then press Space to jump. Combine direction keys to aim diagonally. Press R or Retry to reset, including during a jump.

## Landing

Land on cars, trolleys, or cones to flatten them and continue from the landing point. Each object adds one insurance claim the first time it is crushed. Wrecks remain until Retry or the next lot; landing on a wreck adds no further claim. Aiming outside the lot stops the marker at the nearest valid point inside the curb. The car lands there without a reset or an extra claim. Flights can pass over obstacles. The car always finishes upright, facing the parking bay's direction.

## Lots

Play seven lots in order. After parking, Next lot advances and Retry restarts the current lot. After the finale, Play again starts a new run. Completed shares include the lot name.

| Lot | Challenge |
| --- | --- |
| One Spot Over | Learn the short sideways flip. |
| Full Lot | Find clear intermediate landings among parked cars. |
| Unexpected Item | Time a landing around a runaway trolley. |
| Reverse Psychology | Watch one car reverse, join the aisle, and leave. |
| Space Invaders | Beat staggered arrivals to a shared parking bay. |
| After You. No, You. | Find tighter staging spots among three arriving and departing cars. |
| Final Boss: Parking | Park among three moving cars and a trolley in a crowded lot. |

Bays stay fixed. Cars enter from the left, turn into a space, reverse into the aisle, and exit on the right. Reverse Psychology has one departure; later lots receive staggered replacement arrivals. All seven lots have short road openings marked IN and EXIT. White reverse lights warn before backing out, and amber indicators show parking turns. The landing ring warns about intact stationary cars and cones. Read the moving cars and trolley yourself; aiming does not reveal their future positions. Drivers and the trolley yield to occupied ground, including the player, other cars, and wrecks. Drivers exchange one beep when waiting for the player and resume smoothly when the way is clear. A long wait reveals “You can’t park there, mate.” Crashes with cars and the trolley occur on landing. Crushed cars stop at the impact point and count once. Landing fully inside the bay still wins if you crush its occupant. This adds a claim but does not block progress. There are no buttons, ice tiles, timers, or limited lives.

Every lot has a sign with a hidden reply. Hit a cone to wear it as a hat, or land on a car to make it reply with a "beep!" bubble. A third landing on the same car reveals "This is fine"; crushing a moving car discovers "Traffic jam." Clean parking earns a lot-specific receipt pun. Damage remains optional. The harder challenge is parking cleanly with fewer flips.

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
| `game_error` | Renderer initialization failed; includes `reason: webgl_unavailable`, the original `error_message`, and the browser's `context_message` when available. |

Level events include the level number/name, attempt number, flips, claims, and visible gameplay seconds since the attempt's first flip. Duration excludes hidden-tab time, waiting before the first flip, and replay playback. Game totals use saved scores, not discarded retries. Playback does not emit starts or completions. Share results cannot confirm that a post was published or delivered; manual-copy fallback cannot confirm copying.

Compare level starts and completions by level in Umami, then inspect retries, duration, and claims for difficult sections. Use sessions and funnels to track player progression. Raw counts include repeat attempts. Compare pageviews with game starts for visitors who never play, and completions with share clicks for sharing interest. Exit events can be lost when browsers close; do not treat missing exit events as continued play. These signals show behavior, not whether players enjoyed a level.

### GitHub Pages

Push the repository to GitHub with a `main` branch. Open Settings, then Pages, and set Source to GitHub Actions. The included `.github/workflows/deploy.yml` builds and deploys on pushes to `main`, or manually. Change the workflow branch if needed.

### Cloudflare Pages

Connect the repository. Use build command `npm run build`, output directory `dist`, and Node.js 22.12 or newer. The deployment needs no environment secrets or Cloudflare Functions.

### Link previews and icons

The public URL is https://flip.amureki.me/. `.env.production` sets `SITE_URL` for production builds. `public/CNAME` declares the GitHub Pages custom domain; configure the matching domain in the hosting settings and point its DNS record at the host. Override `SITE_URL` only when deploying to a different URL.

The build adds a canonical URL and absolute Open Graph and X image URLs to the HTML and generates `sitemap.xml`. Without `SITE_URL`, local builds still work, but print a warning and omit these URL-dependent fields. Metadata does not depend on JavaScript execution.

`public/og-image.png` is the 1200 × 630 social card. Its source is `assets/og-image.html`, which renders the actual game car with Three.js and uses the game's palette and Arial typography. To regenerate it, run `npm run dev`, open `/assets/og-image.html` in Chrome at a 1200 × 630 viewport with device scale factor 1, wait for `html[data-ready="true"]`, and capture the viewport as `public/og-image.png`. The source page is not included in the production build. The favicon, Apple touch icon, and 192/512-pixel home-screen icons share the flipping-car mark in `public/favicon.svg`. Keep icon PNG exports in sync when editing that SVG. Social image and favicon URLs include a version tag; increase it when replacing these assets. The web manifest supports home-screen launch. It does not provide offline play.

After deployment, check a shared link in your target messaging/social apps and confirm that `og-image.png` is publicly reachable. Social platforms cache previews, so refresh their caches after changes. All shares use the same public game preview; completed scores are included in the post text.

## Implementation

Three.js draws a procedural low-poly scene. TypeScript manages deterministic jump arcs, pointer capture, collision checks at landing, and game state. Vite bundles the app. The interface uses system fonts. Mouse, touch, and pen share Pointer Events. The camera fits the lot to its container with ResizeObserver. The game requires WebGL and a modern browser. Clipboard result sharing needs HTTPS or localhost; failure leaves a readable message.

The game checks collisions at landing. It does not simulate rigid-body physics. It is an unofficial parody, not affiliated with Tesla.

Strong launches perform two rolls. A short launch crouch, visible air jets, landing bounce, and dust ring exaggerate each jump. The flip counter counts rotations; reduced-motion mode keeps the same controls and landing rules with a low arc and no rolls, jets, or landing bounce. The player car uses an original procedural wedge model with a dark canopy, slim light bars, rear wing, and four underside nozzles.

## Sharing

X, WhatsApp, Telegram, and the native share action are visible at the top from the first screen, and again in the completed result. Social links open a composer with the game URL and, after a win, a short score message. No account or API key is needed. Users choose the recipient and send the post themselves.

The native action uses the device share sheet when available; otherwise it copies the game link, with manual selection if clipboard access fails. Cancelling native sharing does not copy anything. There are no score-bearing challenge URLs or shared replay links. Deploy to public HTTPS before sharing; localhost URLs only work on the same device.

Run local share URL and text checks with `npm test`.

## Replays

After each completed lot, Watch replay plays every jump since the latest Retry, including failed landings and crashes. Replays preserve the original jump timing, including pauses, with a two-second hold after the final landing. Watch replay keeps the normal gameplay size and camera, including when the window is resized. Replay uses the current reduced-motion preference.

Back to score, Escape, or hiding the tab stops playback and restores the completed score. Players can use their own screen recorder while watching. There is no built-in video export.

In Unexpected Item, the trolley crosses the bay on a repeatable eight-second cycle. Landing on it files one claim, flattens it, and stops it at the impact point. The player stays at the landing point. Retry restarts the cycle. Replay preserves each driver’s and the trolley’s paused clock and acceleration state, and restores stopped cars at their impact positions. The shared level clock continues after a trolley is crushed and pauses while the page is hidden.

## Vehicle models

Parked vehicles are original, unbadged compact, fastback, SUV, and semi tractor designs. The tractor appears in Unexpected Item. Mesh dimensions also define collision footprints and body/roof landing surfaces; these are stylized game units, not manufacturer specifications. No promotional photographs or manufacturer model assets are included. This is not legal clearance.

Each lot has an optional clean parking goal: finish within its flip budget with zero collisions. Goals are 1, 3, 3, 3, 4, 4, and 4 flips. Long jumps count as two flips. Receipts show each achieved clean parking goal and the final count; missing the goal never blocks the next lot.

After clearing all seven lots, use Retry beside any level in the final receipt. Completing that lot returns to the updated final receipt. Other scores stay unchanged; the retried lot keeps the result with fewer claims, then fewer flips. Play again starts from level one while retaining personal bests. Progress and best scores are saved in this browser. Refresh restores the current level or completed receipt; unfinished attempts restart. Replays are not saved. Clearing browser site data removes the save.
