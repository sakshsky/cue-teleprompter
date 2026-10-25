CUE TELEPROMPTER + VIDEO RECORDING

All application source is in dist/: index.html, style.css, app.js, recording.js.

Run locally using Python 3:
  python -m http.server 3017 --bind 127.0.0.1 --directory dist
Open http://127.0.0.1:3017 in a modern browser.
For mobile use, upload dist/ to an HTTPS static host, or use the hosted app.
Camera recording requires HTTPS or localhost and browser camera/mic permission.
Do not use an ordinary HTTP LAN address for phone recording.

1. Enter your script, speed and countdown.
2. Tap Enable camera & mic and allow both permissions.
3. Tap Record & read. Capture and scrolling begin after the countdown.
4. Stop recording, preview your take and tap Download video.

Pause reading pauses text only, not recording. Recording continues at the end
of the script until stopped (maximum 10 minutes per take). Hiding the app
stops recording and turns off camera/mic. Camera off also ends recording.
Select front/rear camera before enabling it. Turn camera off to change camera.
The preview is mirrored for front-camera framing; recordings are not mirrored.
Only camera video and microphone audio are recorded; script text is excluded.

Videos stay in browser memory until downloaded. Download before leaving or
reloading. Script autosave does not save videos. Format is WebM or MP4 as
supported by your browser. Long recordings may use substantial device memory.

No npm packages, API keys or external media services are needed.
Tests (Node.js): node --test recording.test.cjs
Tests mock browser media APIs; real camera/mic behavior needs device testing.

Camera overlay update: live camera fills the reading area behind the scrolling text, including Focus mode. A dark tint and text shadow improve readability. The downloaded video does not contain script text.

