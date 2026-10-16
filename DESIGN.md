---
name: Flip My Ride
description: Full-screen parking game with minimal controls.
colors:
  background: "#d5d8dc"
  text: "#16191d"
  button: "#20252c"
  focus: "#1865d8"
  target: "#96bb69"
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

The orthographic camera fits the whole lot on desktop and mobile. Pointer dragging maps to the ground plane with a maximum nine-unit jump. The player model follows the supplied Roadster photos: a narrow wedge body with wheel arches, a continuous bronze-dark glass canopy tapering rearward, full-width white and red light strips, broad angular wheel spokes, a dark rear panel and diffuser, and a lowered deck spoiler. Doors stay closed. Wheel contact shadows follow the narrower track. The model fits inside the existing gameplay collision footprint. Side exhaust originates at the body surface without visible hardware. Parked cars retain their simple box shapes so the player is distinct.

A short crouch precedes takeoff. Strong jumps perform two rolls. Higher arcs, air jets, a landing bounce, and an expanding dust ring provide the comedy. Side jets switch from one side to the other halfway through each jump. Each active outlet has a dense vapor core with a short opening burst. Exhaust uses only soft sprites, with uneven overlapping lobes and broad drifting trails; there are no solid cone jets. White trail puffs vary in size, speed, and lifetime, then expand and fade softly in world space using a fixed pool of 160 particles. The vapor adds no visible hardware to the body. Retry clears the vapor, and reduced-motion mode disables it. Landing remains deterministic. The counter counts rolls. Reduced-motion mode retains a low jump arc and disables rolls, jets, bounce, and shockwave.

A single bottom feedback area shows the instruction, then one launch joke, then the landing outcome. It reserves two lines to keep controls steady and uses an atomic live region. Control hints remain in a separate quieter line; no floating caption covers the scene. A blue outline marks focus. The result overlay appears only on success. Retry clears particles, effects, and input state immediately. No camera shake or added controls.

## Sharing

Direct X, WhatsApp, Telegram, and native share actions are visible at the top from the first screen and in the result. No intermediate Share button, menu, challenge-link control, or download control. Before completion, share text describes the game; after completion it includes the score. The native action falls back to copying the URL.

Sharing uses locally embedded Simple Icons SVG marks for X, WhatsApp, and Telegram, plus an outlined native-share icon. All top actions occupy one compact row beside Retry. Accessible labels and hover titles name each destination. Retry always shows a bordered R key badge, including on mobile. Result sharing uses the same icon row.

## Parking jokes

A small NO KICKFLIPS sign stands behind the target bay. Launch captions respond to jump power; landing captions respond to clearing a parked car or filing a claim, with collisions taking priority. The completion overlay includes a compact insurance receipt with the actual claim count, a €0 parking fee, and pending insurance only when claims exist.

## Lots

A small label below the header shows the current lot and progress through four increasingly crowded lots. After parking, Next lot and Retry sit side by side. The last lot makes the visible social icon row primary, labels it Share your score, and focuses its first action. Play again and Retry use secondary styling. Layout changes reuse the scene and controls.

## Lighting

Warm directional sunlight and cool sky fill use filmic tone mapping and filtered soft shadows. The Roadster uses a precomputed reflection map and a restrained clear coat. A soft ground contact shadow beneath its body and tires fades with jump height. The reflection map is generated once; contact shadows use five shared-texture planes without a full-screen rendering pass.

Round receipts use parking-citation jokes. The final Licence to Flip shows completed-lot count and totals across completed rounds, with a claim-based verdict and an UNFIT FOR NORMAL ROADS stamp. Retrying replaces the current round score; starting a new run clears totals. Sharing remains primary.

Unexpected Item introduces timing in the third lot. A wire shopping trolley with a red handle and one wobbling wheel crosses the target bay. Reduced motion removes the decorative wobble, retaining the gameplay movement. Collision is checked only on landing. Last Space combines crowded route planning with a trolley moving along the final approach; its intermediate landing gaps remain safe.

## Ground

Asphalt uses a single seeded 1024-pixel texture with fine low-contrast grain, three faint paired tire marks, and lightly chipped parking lines. Surface detail is generated once and remains stable across retries and replays. The green target bay stays crisp. The texture uses mipmaps and bounded anisotropic filtering to limit shimmer at the game camera angle.
