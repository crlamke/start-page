# Sounds

Alarm and timer sounds for the Start Page. Pick one for each alarm and for
the timer on the start page itself, or set the defaults in
`config-editor.html` (Alarm clock & timer → How alarms ring).

| File | Sound |
|---|---|
| `chime.wav` | two-note doorbell chime |
| `bell.wav` | a struck hand bell |
| `digital.wav` | bedside digital alarm (four quick beeps) |
| `gentle.wav` | soft rising arpeggio |
| `wake-up.wav` | rising three-tone call |

These were synthesized by `make_sounds.py` (Python standard library only),
so they are original and covered by the project's MIT license. Run
`python3 snd/make_sounds.py` to rebuild them.

## Adding your own

1. Copy the sound file into this folder. MP3, WAV, OGG and M4A all play in
   current browsers. A short clip works best; it repeats until the alarm
   is dismissed (for up to two minutes).
2. Add a line for it to `sounds.js`, for example:

   ```js
   { "name": "Ship's bell", "file": "snd/ships-bell.mp3" },
   ```

3. Reload the start page. The new sound appears in the sound lists.

Only use sounds you have the right to use. If a sound file is missing or
can't play, the alarm uses the built-in beep instead, so it never rings
silently by mistake.
