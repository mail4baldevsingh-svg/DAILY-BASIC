# Sharpen Your Axe — hand-drawn reel

A 46-second vertical (1080×1920, 24 fps) animation of the "sharpen the axe" story, drawn
with [p5.js](https://p5js.org) + [p5.brush](https://github.com/acamposuribe/p5.brush) and timed
word-for-word to the original Hinglish voice-over.

## How it is made

- **Watercolour plates** (`js/bake.js`): forest, office, night sky, etc. are painted once with real
  p5.brush watercolour fills and saved to `assets/plates/`. Those fills take seconds each in
  software WebGL, so they are never painted per frame.
- **Characters and props** (`js/characters.js`, `js/scenes*.js`): drawn live every frame as layered
  flat paint plus p5.brush ink outlines. Linework is re-seeded 12 times a second, so it "boils"
  like hand-drawn animation on twos.
- **Text** (`js/overlay.js`): word-by-word captions (timings in `js/timeline.js`), the hook
  headline and in-scene labels are drawn on a Canvas2D layer on top, with paper grain.
- **Rendering** (`tools/`): headless Chromium with SwiftShader renders each frame; ffmpeg muxes the
  frames with the original audio.

## Commands

```bash
npm install
npm run bake                       # repaint the watercolour plates (≈3 min)
node tools/preview.mjs out 1.6 9.5 # stills + contact sheet for chosen timestamps
npm run render                     # all 1114 frames into ./frames (≈30 min on 4 cores)
tools/encode.sh frames <original-video.mp4> out/sharpen-your-axe.mp4
```

## Credits

- Voice-over audio: @jagmohansachdeva (the video is made for him).
- p5.brush © Alejandro Campos Uribe, MIT. Fonts: Luckiest Guy and Kalam (SIL OFL, see `fonts/`).
