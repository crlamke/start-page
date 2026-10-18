/*
 * Sounds the alarm clock and timer can use. To add your own, copy the file
 * (.mp3, .wav, .ogg or .m4a) into this snd folder and add a line below with
 * a name and its path, e.g.
 *     { "name": "Ship's bell", "file": "snd/ships-bell.mp3" },
 * The built-in beep and "Silent" are always offered as well.
 *
 * A page opened from disk can't list a folder, which is why the sounds are
 * listed here.
 */

var startPageSounds = [
    { "name": "Chime", "file": "snd/chime.wav" },
    { "name": "Bell", "file": "snd/bell.wav" },
    { "name": "Digital alarm", "file": "snd/digital.wav" },
    { "name": "Gentle", "file": "snd/gentle.wav" },
    { "name": "Wake up", "file": "snd/wake-up.wav" }
];
