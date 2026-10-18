#!/usr/bin/env python3
"""Make the Start Page's alarm sounds (snd/*.wav).

The sounds are synthesized here, so they are original and free to use
under the project's MIT license. Run it again to rebuild them:

    python3 snd/make_sounds.py

Only the Python standard library is needed. Each sound is a short clip
that the page plays on a loop while an alarm rings, so each one ends with
a little silence before it repeats.
"""

import math
import os
import struct
import wave

RATE = 22050                     # samples per second (plenty for alarm tones)
HERE = os.path.dirname(os.path.abspath(__file__))


def silence(seconds):
    return [0.0] * int(RATE * seconds)


def tone(freqs, seconds, decay=0.0, attack=0.005, release=0.02, shape="sine"):
    """A note made of one or more (frequency, loudness) partials.

    decay   exponential fade rate (0 = held at full volume)
    attack  fade-in time in seconds (avoids clicks)
    release fade-out time at the end in seconds
    shape   "sine" or "square"
    """
    n = int(RATE * seconds)
    out = []
    for i in range(n):
        t = i / RATE
        v = 0.0
        for f, amp in freqs:
            phase = 2 * math.pi * f * t
            v += amp * (math.sin(phase) if shape == "sine"
                        else (1.0 if math.sin(phase) >= 0 else -1.0))
        env = math.exp(-decay * t) if decay else 1.0
        env *= min(1.0, t / attack) if attack else 1.0
        env *= min(1.0, (seconds - t) / release) if release else 1.0
        out.append(v * env)
    return out


def mix_at(base, clip, start_seconds):
    """Add clip into base starting at start_seconds (base grows if needed)."""
    start = int(RATE * start_seconds)
    if len(base) < start + len(clip):
        base.extend([0.0] * (start + len(clip) - len(base)))
    for i, v in enumerate(clip):
        base[start + i] += v
    return base


def save(name, samples, peak=0.8):
    top = max(abs(s) for s in samples) or 1.0
    scale = peak / top
    path = os.path.join(HERE, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s * scale)) * 32767))
                               for s in samples))
    print("wrote", path, "%.1f s" % (len(samples) / RATE))


def chime():
    """Two-note doorbell-style chime (E6 then C6), soft bell partials."""
    def note(f):
        return tone([(f, 1.0), (f * 2, 0.35), (f * 3, 0.12)], 1.1, decay=3.2)
    s = []
    mix_at(s, note(1318.5), 0.0)
    mix_at(s, note(1046.5), 0.45)
    return s + silence(0.5)


def bell():
    """A struck hand bell: inharmonic partials with a long ring."""
    f = 880.0
    partials = [(f * 0.5, 0.6), (f, 1.0), (f * 1.19, 0.5), (f * 1.56, 0.35),
                (f * 2.0, 0.3), (f * 2.51, 0.18), (f * 3.01, 0.1)]
    return tone(partials, 2.2, decay=2.2, attack=0.002) + silence(0.3)


def digital():
    """Classic bedside digital alarm: four quick beeps, then a pause."""
    s = []
    for k in range(4):
        mix_at(s, tone([(2048.0, 1.0)], 0.07, shape="square", attack=0.002, release=0.004),
               k * 0.13)
    return s + silence(0.48)


def gentle():
    """A soft rising marimba-like arpeggio (C5 E5 G5 C6)."""
    s = []
    for k, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
        mix_at(s, tone([(f, 1.0), (f * 4, 0.08)], 0.9, decay=5.0), k * 0.22)
    return s + silence(0.9)


def wake_up():
    """Rising three-tone 'wake up' sweep, repeated twice."""
    s = []
    for rep in range(2):
        for k, f in enumerate([660.0, 880.0, 1100.0]):
            mix_at(s, tone([(f, 1.0), (f * 2, 0.2)], 0.16, attack=0.01, release=0.03),
                   rep * 0.7 + k * 0.18)
    return s + silence(0.4)


if __name__ == "__main__":
    save("chime.wav", chime())
    save("bell.wav", bell())
    save("digital.wav", digital())
    save("gentle.wav", gentle())
    save("wake-up.wav", wake_up())
