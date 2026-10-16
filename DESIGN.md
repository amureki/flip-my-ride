---
name: Flip My Ride
description: Full-screen parking game with minimal controls.
colors:
  background: "#d5d8dc"
  text: "#16191d"
  button: "#20252c"
  focus: "#1865d8"
  target: "#809b69"
typography:
  body:
    fontFamily: "Arial, sans-serif"
    fontSize: "14px"
rounded:
  button: "5px"
  result: "8px"
---

# Game interface

User direction: simple game interface; no editorial palette or decorative page layout.

The canvas fills the viewport. A small title, flip count, and Retry button sit at the top. Controls and status sit at the bottom. Neutral gray, black, and white frame the scene. Green identifies the parking target. No web fonts, oversized headings, page sections, or introductory copy.

The orthographic camera fits the whole lot on desktop and mobile. Desktop pointer dragging maps to the ground plane with a maximum nine-unit jump. On devices with a coarse primary pointer, a thumb pad sits below the lot in portrait and beside it on short landscape screens. The camera fits the separate stage clear of the controls. The pad uses a pale gray (#e5e8ec) surface and gray (#8b949e) boundary with the existing dark and blue control colors. Pad drags use screen direction and map the pad radius to the same nine-unit maximum; releasing launches. Touches on the lot do not aim. Cancellation, focus loss, retry, and viewport changes clear the gesture. Desktop mouse and keyboard controls retain their existing mapping. The player model follows the supplied Roadster photos: a narrow wedge body with wheel arches, a continuous bronze-dark glass canopy tapering rearward, full-width white and red light strips, broad angular wheel spokes, a dark rear panel and diffuser, and a lowered deck spoiler. Doors stay closed. Wheel contact shadows follow the narrower track. The model fits inside the existing gameplay collision footprint. Side exhaust originates at the body surface without visible hardware. Parked cars use restrained rounded body edges, dark split windows, inset tires with silver rim rings, and paired slim lamps. Their simple silhouettes remain distinct from the Roadster.

A short crouch precedes takeoff. Strong jumps perform two rolls. Higher arcs and air jets provide the comedy. Landing strength follows jump distance: 8–18 small dust puffs spread from the tire positions, with a faint expanding ring. The body compresses by at most 0.024 world units and rebounds once over 0.3–0.45 seconds; wheels stay planted and the body is not stretched. Reduced motion uses four small dust puffs without suspension movement or a ring. Side jets switch from one side to the other halfway through each jump. Each active outlet has a dense vapor core with a short opening burst. Exhaust uses only soft sprites, with uneven overlapping lobes and broad drifting trails; there are no solid cone jets. White trail puffs vary in size, speed, and lifetime, then expand and fade softly in world space using a fixed pool of 160 particles. The vapor adds no visible hardware to the body. Retry clears the vapor, and reduced-motion mode disables it. Landing remains deterministic. The counter counts rolls. Reduced-motion mode retains a low jump arc and disables rolls, jets, bounce, and shockwave.

A single bottom feedback area shows the instruction, then one launch joke, then the landing outcome. It reserves two lines to keep controls steady and uses an atomic live region. Control hints remain in a separate quieter line; no floating caption covers the scene. A blue outline marks focus. The result overlay appears only on success. Retry clears particles, effects, and input state immediately. No camera shake or added controls.

## Sharing

Direct X, WhatsApp, Telegram, and native share actions are visible at the top from the first screen and in the result. No intermediate Share button, menu, challenge-link control, or download control. Before completion, share text describes the game; after completion it includes the score. The native action falls back to copying the URL.

Sharing uses locally embedded Simple Icons SVG marks for X, WhatsApp, and Telegram, plus an outlined native-share icon. All top actions occupy one compact row beside Retry. Accessible labels and hover titles name each destination. Retry always shows a bordered R key badge, including on mobile. Result sharing uses the same icon row.

## Parking jokes

A small NO KICKFLIPS sign stands behind the target bay. Launch captions respond to jump power; landing captions respond to clearing a parked car or filing a claim, with collisions taking priority. The completion overlay shows flips, claims filed, and one short pun.

## Lots

A small label below the header shows the current lot and progress through four increasingly crowded lots. After parking, Next lot and Retry sit side by side. The last lot makes the visible social icon row primary, labels it Share your score, and focuses its first action. Play again and Retry use secondary styling. Layout changes reuse the scene and controls.

## Lighting

Warm directional sunlight and cool sky fill use filmic tone mapping and filtered soft shadows. The Roadster uses a precomputed reflection map and a restrained clear coat. A soft ground contact shadow beneath its body and tires fades with jump height. The reflection map is generated once; contact shadows use five shared-texture planes without a full-screen rendering pass.

Round receipts use a playful parking headline and one outcome-specific pun. The final Licence to Flip shows completed-lot count and flip/claim totals across completed rounds, with one claim-based verdict. Retrying replaces the current round score; starting a new run clears totals. Sharing remains primary.

Unexpected Item introduces timing in the third lot. A wire shopping trolley with a red handle and one wobbling wheel crosses the target bay. Reduced motion removes the decorative wobble, retaining the gameplay movement. Collision is checked only on landing. Last Space combines crowded route planning with a trolley moving along the final approach; its intermediate landing gaps remain safe.

## Ground

Asphalt uses a single seeded 1024-pixel texture with fine low-contrast grain, three faint paired tire marks, and lightly chipped parking lines. Surface detail is generated once and remains stable across retries and replays. The green target bay stays crisp. The texture uses mipmaps and bounded anisotropic filtering to limit shimmer at the game camera angle.

## Scene consistency

The lot base uses softly rounded edges and fine curb joints. Trees use tapered trunks and three compact faceted crown masses with restrained green variation. The target bay has a muted green fill with crisp pale borders and a clear P. A thin landing ring uses a check for clear ground, an amber exclamation for collision risk, and an orange cross outside the lot. Symbols remain visible over obstacles. Collision warnings include cars, cones, and the predicted trolley position. The warning updates while aiming, including when the trolley moves.

## Crush and continue

Landing on parked cars or the trolley keeps the player at the landing point. Each newly crushed object adds one claim; overlapping objects each count once. Cars compress into broad wrecks with splayed wheels. The trolley flattens and stops at its exact impact position. Cones flatten in place. Damage remains through later jumps and the score screen, and resets on Retry or the next lot. Reduced motion applies the final damage immediately. Out-of-bounds landings still return to the previous position. Clean parking means finishing without claims; destruction never blocks completion.

Receipts retain a centered receipt heading and lot name, aligned flip and claim rows, a dashed divider, and parking-fee and repair-bill rows. One punchline reflects damage, with cars taking priority over trolleys and cones. A short thank-you footer completes the receipt. Itemized damage, stamps, and fine print are omitted to keep the score quick to read. Retry replaces the current lot’s score.

The result uses a compact score section and a separate action section. Aligned rows show flips, claims, the parking fee, and a repair-bill joke, followed by one outcome punchline and a short receipt footer. Actions retain 44px targets and never scroll with the receipt. Short landscape screens place actions beside the score; on other screens they sit below it. The score section alone scrolls under text enlargement. The result fits the dynamic viewport and hides gameplay hints while open.
