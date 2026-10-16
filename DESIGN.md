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

Keep the interface focused on the game, without a decorative page layout.

The canvas fills the viewport. A small title, flip count, and Retry button sit at the top. Instructions are painted flat onto the asphalt and fade out after the first valid flip. Live status follows the far map edge’s diagonal, just outside the curb; the mobile thumb pad and credit remain at the bottom. Neutral gray, black, and white frame the scene. Green identifies the parking target. No web fonts, oversized headings, page sections, or introductory copy.

## Aiming and camera

The orthographic camera fits the whole lot on desktop and mobile. Desktop presses select the ground point under the pointer, with a maximum nine-unit jump. Holding and moving adjusts the landing ring; release launches even without dragging. Escape cancels. Cancellation events only affect the active pointer.

On devices with a coarse primary pointer, a thumb pad is centered below the stage in portrait, and centered in the right-hand control area on short landscape screens. Its visible outline is 96 × 96 pixels within a 128 × 128 pixel touch area. Instructions overlay the road, leaving only the pad and credit below the stage. The camera fits the separate stage clear of the controls.

Mobile uses a diagonal elevated camera with a 22.2-unit minimum view width. Keep the full playable lot visible, even if that limits zoom. Decorative scenery can crop. Short desktop windows reserve 80px above and 36px below the stage so the lot cannot overlap the controls; results and errors use the full stage. The camera remains fixed during aiming, flight, and landing; only viewport or input-mode changes reframe it.

Mobile feedback uses 16px text and control hints use 14px text. The pad uses a pale gray (#e5e8ec) surface and gray (#8b949e) boundary with the existing dark and blue control colors. Pad drags use screen direction. Full power requires 96 CSS pixels of travel, or two pad radii. A quadratic response curve gives finer control over short jumps, with a nine-unit maximum. Releasing uses the last visible landing preview, ignoring coordinate changes as the finger lifts. Sliding back to the touch starting point clears the preview and cancels on release. Pointer capture allows dragging beyond the pad. Touches on the lot do not aim. Cancellation, focus loss, retry, and viewport changes clear the gesture.

## Vehicle models

The player model follows the supplied Roadster photos: a narrow wedge body with wheel arches, a continuous bronze-dark glass canopy tapering rearward, full-width white and red light strips, broad angular wheel spokes, a dark rear panel and diffuser, and a lowered deck spoiler. Doors stay closed. Wheel contact shadows follow the narrower track. The model fits inside the existing gameplay collision footprint. Side exhaust originates at the body surface without visible hardware.

Parked cars use slightly rounded body edges, dark split windows, inset tires with silver rim rings, and paired slim lamps. Their simple silhouettes remain distinct from the Roadster.

## Jump effects

The car crouches briefly before takeoff. Strong jumps perform two rolls. High arcs and air jets exaggerate the jump. Landing strength follows jump distance: 8 to 18 small dust puffs spread from the tire positions, with a faint expanding ring. The body compresses by at most 0.024 world units and rebounds once over 0.3 to 0.45 seconds; wheels stay planted and the body is not stretched. Reduced motion uses four small dust puffs without suspension movement or a ring.

Side jets switch from one side to the other halfway through each jump. Each active outlet has a dense vapor core with a short opening burst. Exhaust uses only soft sprites, with uneven overlapping lobes and broad drifting trails; there are no solid cone jets. White trail puffs vary in size, speed, and lifetime, then expand and fade in world space using a fixed pool of 160 particles. Retry clears the vapor, and reduced-motion mode disables it. Landing remains deterministic. The counter counts rolls. Reduced-motion mode retains a low jump arc and disables rolls, jets, bounce, and shockwave.

## Feedback

A single-line atomic live region aligned with the far map edge shows the lot hint, then one launch joke, then the landing outcome. Only control instructions appear on the road; the parking objective is omitted. Control instructions are worn off-white paint on a flat mesh on the asphalt. They follow the road perspective, receive shadows, and are occluded by cars. They fade out over 300ms after the first valid flip and return on Retry or a new lot. Reduced motion hides them immediately. Replay captions use the same feedback text. A blue outline marks focus. The result overlay appears only on success. Retry clears particles, effects, and input state immediately. The camera does not shake.

## Sharing

Direct X, WhatsApp, Telegram, and native share actions are visible at the top from the first screen on desktop and in the result on all devices. Mobile reserves the header for the title, flip count, and Retry. No intermediate Share button, menu, or challenge-link control. Watch replay appears only in the completed result. Before completion, share text describes the game; after completion it includes the score. The native action falls back to copying the URL.

Sharing uses locally embedded Simple Icons SVG marks for X, WhatsApp, and Telegram, plus an outlined native-share icon. All top actions occupy one compact row beside Retry. Accessible labels and hover titles name each destination. The header Retry button has a 44px minimum height on mobile and hides its keyboard badge. Desktop Retry retains the bordered R key badge. Result sharing uses the same icon row.

Watch replay uses a secondary button below the social sharing row. Playback keeps the normal gameplay canvas, camera scale, and responsive sizing. Failed landings and original pauses remain visible, and reduced-motion settings still apply. Back to score exits playback; the other controls are inactive until the completed result returns. There are no video export or download controls.

## Parking jokes

A small sign with a different joke for each lot stands on the left curb, outside the asphalt and away from the target bay. Launch captions respond to jump power; landing captions respond to clearing a parked car or filing a claim, with collisions taking priority. The completion overlay shows flips, claims filed, and one short pun.

## Lots

A small label below the header shows the current lot and progress through seven increasingly difficult lots. After parking, Next lot and Retry sit side by side. The last lot makes the visible social icon row primary, labels it Share your score, and focuses its first action. Play again and Retry use secondary styling. All lots use the same scene and controls.

## Lighting

Warm directional sunlight and cool sky fill use filmic tone mapping and filtered soft shadows. The Roadster uses a precomputed reflection map and a restrained clear coat. A soft ground contact shadow beneath its body and tires fades with jump height. The reflection map is generated once; contact shadows use five shared-texture planes without a full-screen rendering pass.

## Scores

Round receipts use a parking joke as the headline and one outcome-specific pun. The final Licence to Flip shows completed-lot count and total flips and claims across completed rounds, with one claim-based verdict. Retrying replaces the current round score; starting a new run clears totals. Sharing is the primary action.

## Traffic

Unexpected Item introduces timing in the third lot. A wire shopping trolley with a red handle and one wobbling wheel crosses the target bay. Reduced motion removes the wheel wobble. The trolley still moves. Collision is checked at the final resting point.

Reverse Psychology introduces one driver reversing out and leaving the lot. Space Invaders adds replacement arrivals that park in the fixed target bay. After You. No, You. has three drivers sharing a one-way aisle, with parked cars and cones reducing clean staging space. Final Boss: Parking combines three staggered drivers competing for the target bay with a trolley crossing near the exit. Arrivals start outside the lot. Faster parking maneuvers shorten clear landing windows across levels 5–7. Later levels keep receiving arrivals instead of emptying permanently. Bays stay fixed. The game has no pressure plates, ice tiles, timers, or limited lives.

Moving cars reuse the parked-car models, contact shadows, damage, claims, and horn discoveries. White rear lights turn on 0.75 seconds before reversing. Drivers follow curved parking maneuvers, then travel along the aisle to the right-hand exit. After a gap outside the lot, replacements enter from the left. All seven lots share short access roads ending at the base edge. Cars fade at those road ends while their route continues outside the visible lot. Amber indicators mark turns. Collision footprints rotate with the car; inactive arrivals have no footprint. Aiming shows no traffic footprints or predictive warnings. Players read the drivers and reverse lights to time their jumps. Actual landing collisions still use the rotated footprint of a sideways car. Cars and the trolley use shared footprint checks and pause for the player, other traffic, parked cars, and wrecks. Arrivals for an occupied bay wait upstream until its occupant finishes reversing; the departing car keeps priority. Otherwise, traffic already in the aisle has priority over parking maneuvers. Drivers leave room for a crossing already in use. Remaining ties use a stable order; the yielding driver can back off when there is room. Drivers exchange one beep when waiting for the player. After five seconds, a waiting driver reveals “You can’t park there, mate.” Waiting adds no claim. Drivers resume smoothly from their stopped position. Landing on traffic still causes a crash. Crushing a moving car stops it at its exact impact position. Parking fully inside the bay still succeeds on top of a crushed car. The landing adds a claim, so it does not count as clean parking.

Cars and the trolley each have a local clock that pauses while yielding. The same traffic simulation runs while grounded, during jumps, and when calculating landing support. Replay records all local clocks and acceleration states at each launch. It continues after the trolley is crushed. It pauses when the tab is hidden and clamps the first-frame delta to zero. Retry restarts movement and restores cars. Replay uses recorded flight durations even if reduced-motion preferences change, then restores completed damage and car positions on exit. Gameplay traffic remains visible under reduced motion. All lots use the same aiming, support-height, and collision rules. Clean receipts use a different parking pun for each lot.

## Ground

Asphalt uses a single seeded 1024-pixel texture with fine low-contrast grain, three faint paired tire marks, and lightly chipped parking lines. Surface detail is generated once and remains stable across retries and replays. The green target bay stays crisp. The texture uses mipmaps and bounded anisotropic filtering to limit shimmer at the game camera angle.

## Crush and continue

Landing on parked cars or the trolley keeps the player at the landing point. Each newly crushed object adds one claim; overlapping objects each count once. Cars compress into broad wrecks with splayed wheels. The trolley flattens and stops at its exact impact position. Cones flatten in place. Damage remains through later jumps and the score screen, and resets on Retry or the next lot. Replay rebuilds damage and restores the completed wrecks when exited. Reduced motion applies the final damage immediately. Aiming beyond the lot clamps the landing marker to the nearest point that keeps the car inside the curb. Launch uses that same point; edge landings never return the car to its previous position or add a claim. Clean parking means finishing without claims; destruction never blocks completion.

Receipts retain a centered receipt heading and lot name, aligned flip and claim rows, a dashed divider, and parking-fee and repair-bill rows. One punchline reflects damage, with cars taking priority over trolleys and cones. A short thank-you footer completes the receipt. Itemized damage, stamps, and fine print are omitted to keep the score quick to read. Retry replaces the current lot's score.

## Scene consistency

The lot base uses softly rounded edges and fine curb joints. Trees use tapered trunks and three compact faceted crowns in similar shades of green. The target bay has a muted green fill with crisp pale borders and a clear P. A thin landing ring uses a check for clear ground, and an amber exclamation for collision risk. Targets outside the lot clamp to the reachable curb edge. Symbols remain visible over obstacles. Collision warnings include intact stationary cars and cones. Moving cars and the trolley never affect the warning or bay-fit glow; neither reveals a future traffic opening. Already crushed objects do not add warnings.

The result uses a compact score section and a separate action section. Aligned rows show flips, claims, the parking fee, and a repair-bill joke, followed by one outcome punchline and a short receipt footer. Actions retain 44px targets and never scroll with the receipt. Short landscape screens place actions beside the score; on other screens they sit below it. The score section alone scrolls under text enlargement. The result fits the dynamic viewport and hides gameplay hints while open.

## Social preview

The 1200 × 630 social card uses the actual procedural Roadster model above a green parking bay, on a warm off-white background (#f3f0e9). The car and bay fill the right side. The fixed-size card uses an 88px bold Arial title and a 42px tagline; these sizes are specific to the exported image. A black title and the existing "No driving. Only flips." tagline sit at the left, close to the car. Footer labels are omitted. The card source is `assets/og-image.html`. No generated photography, smoke trails, or advertising-style lettering.

## Optional discoveries

Each lot has a curbside sign with a hidden reply and at least one cone. A clear landing beside the sign is within one flip of the start, inside the lot and away from the goal. Landing near the sign folds it down and reveals a smaller reply. The seven pairs are NO KICKFLIPS / "Please don't.", LOT FULL / "Full of it.", CART BLANCHE / "Cart-astrophe.", BACK IT UP / "Uno reverse.", SPACE INVADERS / "You snooze.", YOU FIRST / "Trust issues.", and FINAL BOSS / "Skill issue." Each distinct sign reply can trigger its own discovery banner once per run.

The first cone hit gives the Roadster a cone hat, retained through subsequent flips.

Contact with a parked car shows small, camera-facing "beep!" speech bubbles alternating above that car and the Roadster. First contact gets one exchange; a second landing on the same car gets two exchanges. Each bubble lasts 0.7 seconds with a short gap, without bouncing or sound. The bubbles follow the cars and clear on Retry, results, and replay. Discovery captions remain available to screen readers. Wrecks do not add repeat claims. A third landing on the same car discovers "This is fine · The warranty has left the chat." Crushing a moving car discovers "Traffic jam · You made it permanent." These use the same once-per-run discovery queue and remain silent in replay. Players can complete every lot without finding these discoveries.

A small off-white discovery banner uses 13px text beneath the lot information, stays for 3.5 seconds, and queues simultaneous discoveries. It does not capture input or animate. Each caption appears once per seven-lot run, including across retries. All discoveries are silent; there is no audio control. Retry and lot changes reset props and pending effects. Replay reconstructs the props silently and restores the completed state when exited.

On mobile, help is horizontal below the lot name and occupies at most two lines. Control guidance sits beside the thumb pad (below it in short landscape), fades after the first valid flip, and returns on Retry. Asphalt instructions are hidden on mobile. Desktop retains the diagonal single-line help and painted controls.
