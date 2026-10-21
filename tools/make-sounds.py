#!/usr/bin/env python3
"""Synthesises ChowBuy's notification sounds and rider ring tones (original, royalty-free, no samples used).
Usage: python3 tools/make-sounds.py   (needs numpy). Writes WAV files into the two apps' assets folders."""
import wave, struct, os, math
import numpy as np

SR = 44100
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

def t(d): return np.linspace(0, d, int(SR * d), endpoint=False)
def env(n, a=0.005, r=0.2, curve=3.0):
    x = np.ones(n); na = max(1, int(SR * a)); x[:na] = np.linspace(0, 1, na)
    nr = max(1, int(n * r)); x[-nr:] *= np.linspace(1, 0, nr) ** curve
    return x
def tone(f, d, vol=0.6, a=0.004, decay=6.0, partials=((1, 1.0),)):
    tt = t(d); y = sum(amp * np.sin(2 * math.pi * f * k * tt) for k, amp in partials)
    return vol * y / max(1e-9, sum(a_ for _, a_ in partials)) * np.exp(-decay * tt) * env(len(tt), a, 0.05, 1)
BELL = ((1, 1.0), (2.76, 0.6), (5.4, 0.35), (8.93, 0.18))      # inharmonic partials give a metallic bell
MARIMBA = ((1, 1.0), (4.0, 0.35), (10.0, 0.08))
def place(parts, total):
    y = np.zeros(int(SR * total))
    for start, sig in parts:
        i = int(SR * start); y[i:i + len(sig)] += sig[:len(y) - i]
    return y
def norm(y, peak=0.89):
    m = np.max(np.abs(y)); return y * (peak / m) if m > 0 else y
def write(path, y):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    y = np.clip(norm(y), -1, 1); data = (y * 32767).astype('<i2').tobytes()
    with wave.open(path, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data)

N = {'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.0, 'C6': 1046.5, 'E6': 1318.5, 'G6': 1568.0, 'A6': 1760.0, 'A4': 440.0, 'E4': 329.63, 'C4': 261.63, 'G4': 392.0}

def notif():
    s = {}
    s['chime'] = place([(0, tone(N['E6'], 0.9, decay=5, partials=BELL)), (0.16, tone(N['A6'], 1.1, decay=4.5, partials=BELL))], 1.3)
    s['bell'] = place([(0, tone(880, 1.5, decay=3.2, partials=BELL))], 1.5)
    s['ding'] = place([(0, tone(1568, 0.7, decay=7, partials=((1, 1), (2, 0.25))))], 0.75)
    pop_t = t(0.18); f = 900 * np.exp(-pop_t * 14) + 250; ph = 2 * math.pi * np.cumsum(f) / SR
    s['pop'] = 0.7 * np.sin(ph) * np.exp(-pop_t * 24)
    s['marimba'] = place([(i * 0.12, tone(f, 0.5, decay=9, partials=MARIMBA)) for i, f in enumerate([N['C5'], N['E5'], N['G5'], N['C6']])], 0.95)
    d_t = t(0.5); f = 1400 * np.exp(-d_t * 9) + 500; s['droplet'] = 0.65 * np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-d_t * 9)
    def honk(f, d): tt = t(d); return 0.5 * np.sign(np.sin(2 * math.pi * f * tt)) * 0.45 * env(len(tt), 0.01, 0.2, 1) + 0.4 * np.sin(2 * math.pi * f * tt) * env(len(tt), 0.01, 0.2, 1)
    s['horn'] = place([(0, honk(420, 0.16)), (0.24, honk(420, 0.32))], 0.7)
    s['fanfare'] = place([(0, tone(N['C5'], 0.5, decay=4, partials=BELL)), (0.13, tone(N['E5'], 0.5, decay=4, partials=BELL)), (0.26, tone(N['G5'], 0.5, decay=4, partials=BELL)), (0.4, tone(N['C6'], 1.0, decay=3.2, partials=BELL))], 1.5)
    return s

def rings():
    s = {}
    def burst(f1, f2, d): tt = t(d); return 0.5 * (np.sin(2 * math.pi * f1 * tt) + np.sin(2 * math.pi * f2 * tt)) * env(len(tt), 0.01, 0.08, 1)
    classic = [(i * 0.07 + (0 if i < 1 else 0), None) for i in range(0)]
    s['classic'] = place([(0.0 + k * 0.5, burst(440, 480, 0.4)) for k in range(2)], 3.0)           # ring-ring, pause
    def honk(f, d): tt = t(d); return (0.4 * np.sign(np.sin(2 * math.pi * f * tt)) + 0.45 * np.sin(2 * math.pi * f * tt)) * env(len(tt), 0.01, 0.15, 1)
    s['horn'] = place([(0, honk(420, 0.18)), (0.26, honk(420, 0.18)), (0.56, honk(380, 0.5))], 3.0)
    sw = t(3.0); ff = 700 + 450 * np.sin(2 * math.pi * sw / 1.5 - math.pi / 2); s['siren'] = 0.55 * np.sin(2 * math.pi * np.cumsum(ff) / SR) * env(len(sw), 0.02, 0.05, 1)
    s['bell'] = place([(k * 0.22, tone(1040 if k % 2 == 0 else 1320, 0.7, decay=5, partials=BELL)) for k in range(8)], 3.0)
    s['pulse'] = place([(k * 0.15, 0.55 * np.sin(2 * math.pi * 1500 * t(0.09)) * env(int(SR * 0.09), 0.004, 0.3, 1)) for k in range(4)] + [(1.5 + k * 0.15, 0.55 * np.sin(2 * math.pi * 1500 * t(0.09)) * env(int(SR * 0.09), 0.004, 0.3, 1)) for k in range(4)], 3.0)
    s['gong'] = place([(0, tone(196, 3.0, decay=1.4, partials=((1, 1), (2.0, 0.7), (2.76, 0.6), (5.4, 0.4), (6.7, 0.2))))], 3.0)
    pat = [N['C5'], N['E5'], N['G5'], N['E5'], N['A5'], N['G5'], N['E5'], N['D5']]
    s['afrobeat'] = place([(k * 0.25, tone(f, 0.45, decay=8, partials=MARIMBA)) for k, f in enumerate(pat)], 2.0)
    s['afrobeat'] = np.concatenate([s['afrobeat'], s['afrobeat'][: int(SR * 1.0)] * 0.0])
    return s

if __name__ == '__main__':
    for k, y in notif().items(): write(os.path.join(ROOT, 'customer-app/assets/sounds', f'notif_{k}.wav'), y)
    for k, y in rings().items(): write(os.path.join(ROOT, 'rider-app/assets/sounds', f'ring_{k}.wav'), y)
    print('done')
