## 4chan sound utils

Utilities for dealing with 4chan WebM files with `[sound=url]` audio in the filename, such as those used by [4chan external sounds](https://sleazyfork.org/en/scripts/31045-4chan-external-sounds), [4chan Sounds Player](https://github.com/rcc11/4chan-sounds-player), etc.

**[Try it here](https://feored.github.io/4chan-sound-utils)**

Everything is done client-side using [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm).
The limitations are mostly speed and support for certain codecs (e.g VP9 seems to make ffmpeg hang every time, so the webm encoding option uses older, slower VP8 instead).


##### Develop

```sh
npm run dev
or
npm run dev -- --open
```

##### Build

```sh
npm run build
```
##### Deploy to Github Pages

```sh
npm run deploy
```