---
name: Just Park It
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

The orthographic camera fits the whole lot on desktop and mobile. Pointer dragging maps to the ground plane with a maximum nine-unit jump. The original procedural player model has a low angular wedge, black canopy, slim lights, rear wing, and four air nozzles. Parked cars retain their simple box shapes so the player is distinct.

A short crouch precedes takeoff. Strong jumps perform two rolls. Higher arcs, air jets, a landing bounce, and an expanding dust ring provide the comedy. Landing remains deterministic. The counter counts rolls. Reduced-motion mode retains a low jump arc and disables rolls, jets, bounce, and shockwave.

Text feedback uses a live region. A blue outline marks focus. The result overlay appears only on success. Retry clears particles, effects, and input state immediately. No camera shake or added controls.

## Sharing

Direct X, WhatsApp, Telegram, and native share actions are visible at the top from the first screen and in the result. No intermediate Share button, menu, challenge-link control, or download control. Before completion, share text describes the game; after completion it includes the score. The native action falls back to copying the URL.

Sharing uses locally embedded Simple Icons SVG marks for X, WhatsApp, and Telegram, plus an outlined native-share icon. All top actions occupy one compact row beside Retry. Accessible labels and hover titles name each destination. Retry always shows a bordered R key badge, including on mobile. Result sharing uses the same icon row.

## Parking jokes

A small NO KICKFLIPS sign stands behind the target bay. Launch captions respond to jump power; landing captions respond to clearing a parked car or filing a claim, with collisions taking priority. The completion overlay includes a compact insurance receipt with the actual claim count, a €0 parking fee, and pending insurance only when claims exist.
