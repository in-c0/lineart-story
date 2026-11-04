# A simple game about life

A wordless, line-art game about two lives, played in a split screen.

**Play:** https://in-c0.github.io/lineart-story/

Two people are born in different places. Their lives play out side by side like a series of
short films. Each episode fades in, plays, and pauses at a moment where you make one small gesture:
hold a hand, reach on a swing, take a photo, send a heartbeat into the dark. Some of those gestures
are choices. They meet, the line between them dissolves, and life gets busy.

> There is no save system in this game.
> Once a choice is made, it cannot be revoked.
> But you can decide what to do next.

- No dialogue or text during play. Faceless figures, so the meaning is yours.
- A half of the screen goes dark when that person is asleep, unconscious, or gone.
- Choices change where they meet, whether they drift apart, who is there when it matters,
  and how the last snowfall turns gold. Separation is not a bad ending.
- Letting a moment pass (about 8 seconds) is a choice too.
- Before they meet, each half runs on its own clock. They can miss each other.
- About 4–6 minutes. Replay to walk another path.

## Controls
Tap or click the faint rotating ring. A few moments ask you to drag. Keyboard: `Tab` to focus,
`Enter` / `Space` to act, arrow keys to move between choices. Headphones recommended.

## Tech
Plain HTML, CSS and JavaScript modules, no build step. Every line is drawn at runtime as SVG
with a pen-like reveal and a slight "boiling" wobble. The score is a procedural felt-piano
written with the Web Audio API; it thickens over the life and opens up at the golden hour.

Run locally: `python3 -m http.server` in this folder, then open `http://localhost:8000`.

Test hooks: `?speed=8` plays faster; `?auto=0,1,9` auto-plays with those choices in order
(9 lets the moment pass); `?ep=meeting&place=city` plays one episode.

## Origin
Built from the design notes *A simple game about life* (with *Director's thoughts* and *game*).
See [DESIGN.md](DESIGN.md) for the reference analysis and the full choice map.
