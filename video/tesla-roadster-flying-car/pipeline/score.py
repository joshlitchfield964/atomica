"""Arrangement: 700.1s score + ambience + sfx, keyed to the act map and intensity curve.
Key: D minor. Score notes in docs/style_bible.md section 6."""
import sys; sys.path.insert(0,'/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/audio')
import numpy as np, engine as E, soundfile as sf
from engine import SR, n, buf, add, db, fade, verb

DUR = 700.2
MUS, AMB, SFX = buf(DUR), buf(DUR), buf(DUR)

D1,D2,F2,A2,Bb2,C3,D3,F3,G3,A3,C4,D4 = 36.71,73.42,87.31,110.0,116.54,130.81,146.83,174.61,196.0,220.0,261.63,293.66

def seg(dst, x, at, gain_db=0.0, rv=0.0, tail=2.4, damp=5200):
    if rv>0: x = verb(x, rv, tail, damp)
    add(dst, db(x, gain_db), at)

# ============ A0  0.55-42.69  cold open: one low note ============
seg(MUS, E.drone(D2, 40.5, detune=.35, bright=300, sub=.55, mv=.18), 2.72, -21, .22, 3.0)
seg(MUS, E.drone(D1, 32.0, detune=.2, bright=190, sub=.8, mv=.12), 10.9, -25)
# "Let's go" -> lift into the event
seg(SFX, E.riser(1.6, 180, 3000, seed=31), 41.1, -26)

# ============ A1  43.56-108.32  the event ============
seg(MUS, E.drone(D2, 66.0, detune=.45, bright=360, sub=.6, mv=.3), 43.3, -19, .2, 3.2)
# pulse builds from the facility description to the launch
pb = E.pulse16(84, 28.0, f=D2, bright=760, seed=23)
pb *= np.linspace(.25, 1.0, len(pb))**1.5
seg(MUS, pb, 50.5, -22)
seg(MUS, E.pulse16(84, 13.0, f=D2, bright=1100, seed=24), 70.9, -20)
# HIT 1 - the barrel roll
seg(SFX, E.hit(3.0, 96, 33, seed=41), 70.72, -11)
seg(SFX, E.riser(1.3, 220, 3600, seed=43), 69.6, -24)
# "Flying cars are real" - a lift, then pull back for the confession
seg(MUS, E.pad([D3,A3,F3], 9.0, bright=1700, seed=33), 92.0, -23, .3, 3.4)
seg(MUS, E.drone(D2, 14.0, detune=.5, bright=240, sub=.7, mv=.1), 96.3, -22)

# ============ A2  108.90-133.09  the tell: pulse strips out ============
seg(MUS, E.drone(D2, 25.5, detune=.9, bright=250, sub=.55, mv=.22, seed=6), 108.6, -20, .25, 3.6)
seg(MUS, E.drone(Bb2, 9.0, detune=.6, bright=210, sub=.5, seed=8), 126.0, -24)   # unease: flat-6
seg(SFX, E.hiss(6.0, 300, 2200, seed=51)*np.linspace(0,1,n(6.0))**2, 127.0, -30)

# ============ A3  133.54-222.59  how it works: mechanical arp ============
def arp(notes, bpm, start, dur, gain, bright=2400, seed=2, dec=.42):
    step=60.0/bpm/2.0; t=0.0; i=0; out=buf(dur+2)
    while t < dur:
        f=notes[i%len(notes)]
        add(out, E.pluck(f, min(step*1.9,.55), bright=bright, decay=dec, seed=seed+i), t)
        t+=step; i+=1
    seg(MUS, out, start, gain, .18, 2.0)
arp([D3,F3,A3,F3,D3,A2,D3,F3], 92, 138.2, 62.0, -24)
# thesis: arp drops out, one held chord
seg(MUS, E.pad([D2,A2,D3], 5.2, bright=900, seed=35), 202.9, -20, .3, 3.2)
arp([D3,F3,A3,C4,A3,F3], 92, 208.6, 13.4, -25, bright=1900)
# "the tank is the limit" - motif tick + hold
seg(MUS, E.drone(D2, 9.0, detune=.4, bright=280, sub=.7), 215.0, -21)
for k in range(6): seg(SFX, E.tick(seed=60+k, bright=3200), 215.4+k*0.62, -30)

# ============ A4  223.46-318.47  nine years: piano, one note per slipped date ============
DATES=[(229.32,D3),(239.62,C3),(249.26,A2),(255.82,A2),(267.11,G3),(271.72,F3),
       (275.18,F3),(285.58,D3),(291.62,C3),(297.80,A2),(303.78,A2),(308.90,F2),(309.38,F2)]
for t,f in DATES:
    seg(MUS, E.piano(f, 4.2, vel=.9), t, -20, .34, 3.8)
seg(AMB, E.air(96.0, seed=71, lo=50, hi=260), 223.0, -34)
# "9 years, 8 slipped dates" -> build, HIT 2, then smash to silence
seg(MUS, E.drone(D2, 6.4, detune=.5, bright=330, sub=.7, mv=.35), 312.4, -21)
seg(SFX, E.riser(2.4, 200, 4200, seed=45), 316.1, -21)
seg(SFX, E.hit(3.4, 100, 32, seed=46), 318.47, -9)

# ============ A5  318.92-379.14  the trims: colder pulse ============
seg(MUS, E.drone(D2, 58.0, detune=.3, bright=300, sub=.5, mv=.2, seed=9), 320.6, -22, .2, 2.8)
seg(MUS, E.pulse16(88, 24.0, f=A2, bright=1250, seed=26), 322.0, -24)
seg(MUS, E.pulse16(88, 14.0, f=A2, bright=820, seed=27), 352.0, -27)
# "isn't for sale" - HIT 3
seg(SFX, E.hit(2.8, 92, 34, seed=47), 376.58, -12)

# ============ A6  379.91-466.53  the number: tension bed, rising fifth ============
seg(MUS, E.drone(D2, 40.0, detune=.55, bright=320, sub=.6, mv=.3, seed=11), 379.6, -21, .22, 3.0)
seg(MUS, E.drone(A2, 26.0, detune=.4, bright=420, sub=.4, mv=.3, seed=12), 396.0, -24)
seg(SFX, E.riser(3.2, 240, 3400, seed=48), 402.4, -27)
seg(MUS, E.pad([D3,A3], 12.0, bright=1500, seed=37), 417.0, -25, .3, 3.2)
seg(MUS, E.drone(D2, 28.0, detune=.5, bright=360, sub=.65, mv=.3, seed=13), 438.5, -21)
# "The launch is the product" - HIT 4
seg(SFX, E.hit(3.0, 88, 32, seed=49), 465.10, -12)

# ============ A7  467.05-541.44  the rivals: open pad ============
seg(MUS, E.pad([D2,A2,D3,F3], 32.0, bright=1600, seed=39, mv=.25), 467.0, -23, .34, 4.0)
seg(MUS, E.pad([F2,C3,F3,A3], 14.0, bright=1800, seed=40), 486.5, -22, .34, 4.0)
# Lilium "is dead" - everything drops away
seg(MUS, E.drone(D1, 6.0, detune=.15, bright=150, sub=.9, seed=14), 519.8, -27)
seg(MUS, E.pad([D2,A2,D3,G3], 22.0, bright=1500, seed=41, mv=.3), 525.0, -22, .32, 3.6)
seg(SFX, E.riser(2.0, 220, 2800, seed=52), 537.0, -28)

# ============ A8  541.90-624.07  the one detail: sub + gauge ticks ============
seg(MUS, E.drone(D1, 84.0, detune=.25, bright=160, sub=1.0, mv=.15, seed=15), 541.5, -20)
seg(AMB, E.hiss(22.0, 1200, 6500, seed=73)*np.linspace(.3,1,n(22.0)), 545.5, -33)
# pressure-gauge ticks: steady, mechanical, through the drain
t=547.9
while t < 566.4:
    seg(SFX, E.tick(seed=int(t*7)%500, bright=3000), t, -29); t += 0.772
# tank empties -> pressure release
seg(SFX, E.hiss(3.2, 400, 5200, seed=75)*np.exp(-np.arange(n(3.2))/(0.55*SR)), 566.3, -20)
# "It hops." - HIT 5
seg(SFX, E.hit(2.6, 84, 31, seed=53), 567.85, -13)
seg(MUS, E.drone(D2, 26.0, detune=.6, bright=260, sub=.7, mv=.25, seed=16), 596.0, -22)
seg(SFX, E.riser(3.0, 200, 3800, seed=54), 619.8, -22)   # into "no regulator on earth"
# smash to silence at 624.07 (nothing scheduled 624.1-625.4)

# ============ A9  624.46-688.74  the verdict: the A0 note, a fifth up ============
seg(MUS, E.drone(A2, 38.0, detune=.35, bright=340, sub=.55, mv=.2, seed=17), 625.6, -22, .26, 3.4)
seg(MUS, E.piano(D3, 5.0, vel=.75), 628.9, -23, .36, 4.0)
seg(MUS, E.piano(A3, 5.0, vel=.68), 640.0, -25, .36, 4.0)
# 663.98 "But here's the twist" - 1.0s of air, then a low entry
seg(MUS, E.drone(D2, 22.0, detune=.5, bright=300, sub=.75, mv=.3, seed=18), 665.0, -21)
seg(SFX, E.riser(2.6, 230, 3200, seed=55), 681.1, -24)
# "a rocket you can park" - HIT 6 + resolution chord
seg(SFX, E.hit(3.6, 104, 30, seed=56), 683.72, -10)
seg(MUS, E.pad([D2,A2,D3,F3,A3], 15.0, bright=1900, seed=42, mv=.2), 684.0, -21, .36, 4.2)

# ============ A10 689.35-700.06  outro tail ============
seg(MUS, E.pad([D2,A2,D3], 10.0, bright=1500, seed=44), 689.0, -25, .34, 3.6)
MUS[n(696.0):] *= np.linspace(1,0,len(MUS)-n(696.0))**1.4

# ============ ambience beds (continuous under everything) ============
seg(AMB, E.air(44.0, seed=81, lo=38, hi=200), 0.0, -36)                  # A0 studio tone
seg(AMB, E.air(68.0, seed=82, lo=45, hi=340), 43.0, -31)                 # A1 night desert
seg(AMB, E.hiss(66.0, 500, 3000, seed=83)*0.5, 43.0, -39)
seg(AMB, E.air(26.0, seed=84, lo=40, hi=400), 108.5, -32)                # A2 wind
seg(AMB, E.hiss(25.0, 350, 2600, seed=85)*(0.5+0.5*np.sin(2*np.pi*0.08*np.arange(n(25.0))/SR)), 108.6, -35)
seg(AMB, E.air(90.0, seed=86, lo=50, hi=300), 133.4, -33)                # A3 compressor hum
seg(AMB, E.air(61.0, seed=87, lo=42, hi=260), 318.8, -34)                # A5
seg(AMB, E.air(88.0, seed=88, lo=44, hi=280), 379.6, -33)                # A6
seg(AMB, E.air(75.0, seed=89, lo=40, hi=320), 467.0, -33)                # A7
seg(AMB, E.air(84.0, seed=90, lo=36, hi=240), 541.5, -34)                # A8
seg(AMB, E.air(66.0, seed=91, lo=42, hi=300), 624.3, -33)                # A9

for nm, x in (("music",MUS),("ambience",AMB),("sfx",SFX)):
    pk=float(np.max(np.abs(x)))
    print(f"{nm:9} peak {pk:6.3f}  rms {float(np.sqrt(np.mean(x**2))):.4f}")
    sf.write(f"/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/audio/stem_{nm}.wav",
             np.stack([x,x],axis=1), SR, subtype="PCM_24")
print("SCORE OK")
