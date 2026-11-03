# lineart-story — design notes

Source: Notion "A simple game about life" + sub-pages *Director's thoughts*, *game*, *.*

## The brief (from the notes)
- Minimal line art, details omitted so the player brings their own meaning. Faceless figures.
- No dialogue or text during play. A series of short films: an episode fades in, plays,
  pauses at an important moment for one small interaction, then fades to the next, in
  chronological order of a lifetime.
- Split screen: two lives born in different places. They meet; the lines merge; they
  separate when each is on their own.
- Choices decide whether they prioritise each other or their own fortune. Different events
  follow (an accident, losing consciousness). Separation is not necessarily a bad ending.
- A half goes pitch dark when that person is unconscious, asleep, or dead.
- Opening message: *There is no save system in this game. / Once a choice is made, it
  cannot be revoked. / But you can decide what to do next.*
- Mood: Golden Hour (slow, steady, emotion bombarding at the highlight), Florence.
  Snowfall, "where are we going?", radio static, primary-school graduation.

## Reference analysis (5 refs, wordless life / relationship games)
| Reference | What it does | Lesson |
|---|---|---|
| **Dear me, I was…** (2026) | Wordless whole-life story in ten chapters, ~1h | Reviews loved the art and music but called the clicks *disruptive* and the lack of choice thin → every pause here must *be* the scene, never "click to continue", and some pauses must be real choices |
| **Florence** (2018) | Relationship told through tiny interactions; conversation puzzles get easier as the couple grows close, harder as they drift | Mechanic = metaphor. The interaction itself carries the feeling |
| **Passage** (Rohrer) | Whole life in 5 min; walking with a spouse widens your sprite and blocks narrow paths | Togetherness has a visible cost and a visible gift |
| **Brothers** | A control goes dead after a loss | Express loss by *absence of an input*, not by a cutscene |
| **Journey** | Bond without words; score swells with progress | Music that grows with the arc; companionship through action only |

Common patterns applied:
1. **Interaction as metaphor** — hold a hand, reach on a swing, pin a photo, send a heartbeat into the dark.
2. **Loss through absence** — the dark half stops accepting input; footprints stop.
3. **Evolving score** — a procedural piano that thickens over the life and peaks at the golden hour.
4. **Space for interpretation** — no words, faceless figures, breath clouds instead of dialogue.
5. **Short and chaptered** — ~12 vignettes, 10–15 minutes, replayable for other branches.

## Choices and consequences
| # | Moment | Options | Consequence |
|---|---|---|---|
| 1 | A's youth | ballet shoes / books | A's work and photos for the rest of the life |
| 2 | B's youth | stay by the sea / leave for the city | where they meet (seaside at dusk / city in rain) |
| 3 | Busy years (each) | the lit door / the shared table | `away` flags; the seam returns and widens per person away |
| 4 | A's mother falls ill | (only if A is away) answer the phone / keep working | present → last snow walk hand in hand; absent → empty bed, radio static |
| 5 | B rushes (only if B away) | accident → B's half goes dark; A taps heartbeats if present, else must answer a call | B wakes with or without A |
| 6 | Old age | — | together: one wide snowy screen, two lines of footprints. apart: each walks alone; the player may tap the seam to open it like a window, once |

The epilogue draws the branching life paths (paths closed vs open) with the taken path in light,
and hangs the polaroids collected along the way.

## Playtest round 1 (ChatGPT as playtester)
Verdict on v1: "an interactive diagram of life events, not a short animated film about a life."
What changed in v2, in the order it ranked them:
1. **Bodies** — geometric figures replaced by a jointed rig (shoulder, elbow, hip, knee, two-bone IK)
   drawn as tapered brush strokes with hair strands, a soft spine curve and a shoulder that leads a reach.
   No per-frame line boiling; each line's imperfection is fixed.
2. **Weight and hesitation** — walks are a gait cycle tied to distance (pelvis bob, eased start/stop,
   child at a shorter stride half a beat behind). Touches go approach → pause → contact.
3. **No UI** — the rotating dashed ring and the branching-path choice diagram are gone. You touch
   things in the scene (a finger, a ball, ballet shoes or books, a dog or a bag, a door or a cup).
   The touched thing breathes; a faint ripple appears only after a long idle.
4. **One recurring gesture** — two cups set down on a table: together, then one left cold while
   waiting, and at the very end one person sets out two cups and puts one back.
5. **Edit** — fades instead of pen-drawing every scene, camera framing per shot (wide / medium /
   close-up on hands), silence around each loss, no closing text.

The swing scene was rebuilt first and re-tested three times: shorter ropes so the arc reads,
the body follows the swing a beat late, she reaches, misses and drops her head, he looks up too late,
then a close shot for the touch.
