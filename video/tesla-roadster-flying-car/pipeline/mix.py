import sys; sys.path.insert(0,'/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/audio')
import numpy as np, soundfile as sf, json
from scipy import signal as sg
import engine as E
from engine import SR, n, db

B="/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/"
vo, sr0 = sf.read(B+"vo_raw_48k.wav")
if vo.ndim>1: vo = vo.mean(axis=1)
print("vo in:", vo.shape, sr0, "peak", round(float(np.max(np.abs(vo))),3))

# ---------- 1. voiceover chain (light: an over-processed voice sounds cheap) ----------
x = E.hp(vo, 80)                                   # rumble / plosive energy
# de-click: clamp isolated sample spikes
d = np.abs(np.diff(x, prepend=x[:1]))
thr = np.percentile(d, 99.98)*3
bad = d > thr
if bad.any():
    idx=np.where(bad)[0]
    for i in idx:
        a,b=max(0,i-2),min(len(x),i+3)
        x[i]=np.median(x[a:b])
    print("de-click: fixed", len(idx), "samples")

# gentle noise floor reduction via spectral gate (very light, 4 dB max)
f,t,Z = sg.stft(x, SR, nperseg=2048, noverlap=1536)
mag=np.abs(Z); pha=np.angle(Z)
nfloor=np.percentile(mag, 8, axis=1, keepdims=True)
g=np.clip((mag-nfloor*1.4)/(mag+1e-12), 10**(-4/20), 1.0)
g=sg.medfilt(g, kernel_size=(1,5))
_,xr = sg.istft(g*mag*np.exp(1j*pha), SR, nperseg=2048, noverlap=1536)
x = xr[:len(vo)] if len(xr)>=len(vo) else np.pad(xr,(0,len(vo)-len(xr)))

# EQ: trim mud, light presence
bq_b, bq_a = sg.butter(2, [240/(SR/2), 380/(SR/2)], 'band')
mud = sg.lfilter(bq_b,bq_a,x); x = x - 0.22*mud                     # -2 dB around 300 Hz
pr_b, pr_a = sg.butter(2, [3200/(SR/2), 5200/(SR/2)], 'band')
pres = sg.lfilter(pr_b,pr_a,x); x = x + 0.14*pres                   # +1.2 dB presence

# de-ess: band-split compressor on 5.5-9 kHz
ds_b, ds_a = sg.butter(2, [5500/(SR/2), 9000/(SR/2)], 'band')
sib = sg.lfilter(ds_b, ds_a, x)
env = sg.filtfilt(*sg.butter(2, 60/(SR/2),'low'), np.abs(sib))
env = np.maximum(env, 0)
over = np.clip(env/(np.percentile(env,97)+1e-9), 1, None)
x = x - sib*(1 - 1/over)*0.75

# compression ~2.5:1, 3 dB GR
def comp(sig, thr_db=-15, ratio=2.5, att=.006, rel=.16):
    e=sg.filtfilt(*sg.butter(2, 40/(SR/2),'low'), np.abs(sig))
    e=np.maximum(e, 1e-7)
    ed=20*np.log10(e)
    over=np.maximum(0, ed-thr_db)
    gr=-over*(1-1/ratio)
    # attack/release smoothing
    step=64; gd=gr[::step]
    aA=np.exp(-step/(att*SR)); aR=np.exp(-step/(rel*SR))
    o=np.empty_like(gd); p=0.0
    for i,t in enumerate(gd):
        c=aA if t<p else aR
        p=c*p+(1-c)*t; o[i]=p
    out=np.repeat(o, step)[:len(gr)]
    if len(out)<len(gr): out=np.pad(out,(0,len(gr)-len(out)),mode='edge')
    return sig*10**(out/20.0), out
x, gr = comp(x)
print("comp: max GR", round(float(np.min(gr)),2), "dB")
x = E.hp(x, 72)
x = x/(np.max(np.abs(x))+1e-9)*0.89
sf.write(B+"audio/stem_voice.wav", np.stack([x,x],axis=1), SR, subtype="PCM_24")

# ---------- 2. duck curve from the real speech regions ----------
segs=json.load(open(B+"transcript.json"))
duck=np.zeros(len(x))
for s in segs:
    a,b2=n(max(0,s["start"]-0.12)), n(min(len(x)/SR, s["end"]+0.22))
    duck[a:min(b2,len(duck))]=1.0
# smooth: 180 ms attack, 300 ms release
k_a=int(.18*SR); k_r=int(.30*SR)
step=128; dd=duck[::step]
cA=np.exp(-step/k_a); cR=np.exp(-step/k_r)
o=np.empty_like(dd); p=0.0
for i,t in enumerate(dd):
    c=cA if t>p else cR
    p=c*p+(1-c)*t; o[i]=p
sm=np.repeat(o, step)[:len(duck)]
if len(sm)<len(duck): sm=np.pad(sm,(0,len(duck)-len(sm)),mode='edge')
MUSIC_DUCK_DB=-9.0; AMB_DUCK_DB=-3.0

def load(nm):
    y,_=sf.read(B+f"audio/stem_{nm}.wav")
    y=y.mean(axis=1) if y.ndim>1 else y
    if len(y)<len(x): y=np.pad(y,(0,len(x)-len(y)))
    return y[:len(x)]
mus, amb, sfx = load("music"), load("ambience"), load("sfx")

mus *= 10**((sm[:len(mus)]*MUSIC_DUCK_DB)/20.0)
amb *= 10**((sm[:len(amb)]*AMB_DUCK_DB)/20.0)

# carve 1-4 kHz out of the music so the voice sits in front
cb,ca = sg.butter(2,[1000/(SR/2),4000/(SR/2)],'band')
mus = mus - 0.30*sg.lfilter(cb,ca,mus)*sm[:len(mus)]

# ---------- 3. balance ----------
def rms_db(y, mask=None):
    z = y[mask] if mask is not None else y
    return 20*np.log10(np.sqrt(np.mean(z**2))+1e-12)
spk = sm>0.5
v_db = rms_db(x, spk)
TRIM={"music":6.5,"amb":8.0,"sfx":-1.0}
for nm,y in (("music",mus),("amb",amb),("sfx",sfx)):
    print(f"  {nm:6} under-voice {round(v_db-rms_db(db(y,TRIM[nm]),spk),1)} LU")

bus = x*1.0 + db(mus, TRIM["music"]) + db(amb, TRIM["amb"]) + db(sfx, TRIM["sfx"])

# ---------- 4. master: limiter then two-pass loudnorm in ffmpeg ----------
assert not np.isnan(bus).any(), "NaN in bus"
pk=np.max(np.abs(bus))
if pk>0.97: bus*=0.97/pk
sf.write(B+"audio/mix_pre.wav", np.stack([bus,bus],axis=1), SR, subtype="PCM_24")
print("pre-master peak", round(float(np.max(np.abs(bus))),3))
