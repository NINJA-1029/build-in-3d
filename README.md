# Techfest in Orbit

An independent interactive website concept for the 30th edition of Techfest, IIT Bombay. The spacecraft, typefaces, scripts and programme artwork are bundled for offline use.

## Open locally

Open `index.html` in a modern browser. There is no build or installation step. To preview over HTTP, run the following command from this directory and open [the local preview](http://127.0.0.1:8000/).

```sh
python -m http.server 8000 --bind 127.0.0.1
```

## Explore

- Drag the spacecraft to rotate it. On a keyboard, focus the model and use the arrow keys. Home restores its starting pose.
- Scroll to change the viewing angle, open a programme card for details, or use the visit section for directions.
- The motion toggle pauses automatic movement. The site respects the device’s reduced-motion setting and provides a software renderer when WebGL is unavailable.

## Source

`scene.js` builds the 3D model and handles interaction. `index.html`, `style.css`, and `site.js` control the main page. The programme cards and detail views use `program.css` and `program.js`.

The three programme illustrations were made with OpenAI ImageGen. Three.js is distributed under its [MIT license](vendor/three-LICENSE.txt). Inter and Instrument Serif are distributed under their respective [Inter](fonts/inter-LICENSE.txt) and [Instrument Serif](fonts/instrument-LICENSE.txt) font licenses.

Festival information and registration are available from [Techfest, IIT Bombay](https://techfest.org/).
