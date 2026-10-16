"""Synthesis engine for the film score. All material original -> no Content ID exposure."""
import numpy as np
from scipy import signal as sg

SR = 48000

def n(sec): return int(round(sec*SR))
def buf(sec): return np.zeros(n(sec), dtype=np.float64)

def add(dst, src, at):
    i = n(at)
    if i >= len(dst): return dst
    j = min(len(dst), i+len(src))
    dst[i:j] += src[:j-i]
    return dst

# ---------- envelopes ----------
def adsr(ln, a=.01, d=.1, s=.7, r=.2):
    e = np.zeros(ln); ai, di = n(a), n(d); ri = n(r)
    si = max(0, ln-ai-di-ri)
    segs = []
    if ai: segs.append(np.linspace(0,1,ai))
    if di: segs.append(np.linspace(1,s,di))
    if si: segs.append(np.full(si,s))
    if ri: segs.append(np.linspace(s,0,ri))
    if segs:
        x = np.concatenate(segs)[:ln]
        e[:len(x)] = x
    return e

def expdec(ln, tau):
    return np.exp(-np.arange(ln)/(tau*SR))

def fade(x, fin=.02, fout=.02):
    ln=len(x); fi,fo=n(fin),n(fout)
    if fi and fi<ln: x[:fi]*=np.linspace(0,1,fi)
    if fo and fo<ln: x[-fo:]*=np.linspace(1,0,fo)
    return x

# ---------- filters ----------
def lp(x, fc, q=0.707):
    fc=max(20,min(fc,SR*0.45))
    b,a = sg.butter(2, fc/(SR/2), 'low'); return sg.lfilter(b,a,x)
def hp(x, fc):
    fc=max(20,min(fc,SR*0.45))
    b,a = sg.butter(2, fc/(SR/2), 'high'); return sg.lfilter(b,a,x)
def bp(x, lo, hi):
    lo=max(20,lo); hi=min(hi,SR*0.45)
    b,a = sg.butter(2,[lo/(SR/2),hi/(SR/2)],'band'); return sg.lfilter(b,a,x)
def lp_sweep(x, f0, f1):
    """Time-varying lowpass, blockwise (cheap but smooth enough for beds)."""
    out=np.zeros_like(x); blk=1024; nb=int(np.ceil(len(x)/blk))
    zi=None
    for k in range(nb):
        s,e=k*blk,min(len(x),(k+1)*blk)
        fc=f0+(f1-f0)*(k/max(1,nb-1))
        b,a=sg.butter(2,max(20,min(fc,SR*0.45))/(SR/2),'low')
        if zi is None or len(zi)!=max(len(a),len(b))-1: zi=np.zeros(max(len(a),len(b))-1)
        out[s:e],zi = sg.lfilter(b,a,x[s:e],zi=zi)
    return out

# ---------- oscillators ----------
def _ph(f, ln):
    if np.isscalar(f): return 2*np.pi*f*np.arange(ln)/SR
    return 2*np.pi*np.cumsum(np.asarray(f))/SR

def sine(f, sec): ln=n(sec); return np.sin(_ph(f,ln))
def saw(f, sec, parts=22):
    ln=n(sec); ph=_ph(f,ln); o=np.zeros(ln)
    for k in range(1,parts+1): o += ((-1)**(k+1))*np.sin(k*ph)/k
    return o*(2/np.pi)
def tri(f, sec, parts=13):
    ln=n(sec); ph=_ph(f,ln); o=np.zeros(ln)
    for i,k in enumerate(range(1,parts*2,2)):
        o += ((-1)**i)*np.sin(k*ph)/(k*k)
    return o*(8/np.pi**2)
def noise(sec, seed=0):
    return np.random.default_rng(seed).normal(0,1,n(sec))

# ---------- reverb ----------
_IR={}
def ir(tail=2.4, pre=.012, seed=7, damp=5200):
    k=(round(tail,3),round(pre,4),seed,damp)
    if k in _IR: return _IR[k]
    ln=n(tail); rg=np.random.default_rng(seed)
    h=rg.normal(0,1,ln)*np.exp(-np.arange(ln)/(tail*0.30*SR))
    h=lp(h,damp)
    p=np.zeros(n(pre)); h=np.concatenate([p,h]); h/=np.max(np.abs(h))+1e-9
    _IR[k]=h; return h

def verb(x, mix=.3, tail=2.4, damp=5200, seed=7):
    if mix<=0: return x
    w=sg.fftconvolve(x, ir(tail,seed=seed,damp=damp))[:len(x)]
    w/= (np.max(np.abs(w))+1e-9); w*= (np.max(np.abs(x))+1e-9)
    return (1-mix)*x + mix*w

# ---------- instruments ----------
def drone(f, sec, detune=.4, bright=380, seed=1, sub=.5, mv=.25):
    """Detuned saw stack + sub, with slow filter movement. The film's bed."""
    ln=n(sec); o=np.zeros(ln); rg=np.random.default_rng(seed)
    for i,c in enumerate([-detune,-detune*.33,0,detune*.4,detune]):
        fv=f*(2**(c/12.0))
        lfo=1+0.0016*np.sin(2*np.pi*(0.06+0.013*i)*np.arange(ln)/SR+rg.random()*6)
        o += saw(fv*lfo, sec, parts=16)*(0.75 if c==0 else 0.45)
    o = lp_sweep(o, bright*(1-mv), bright*(1+mv))
    o += sine(f/2, sec)*sub
    return fade(o/ (np.max(np.abs(o))+1e-9), .9, 1.2)

def pad(freqs, sec, bright=1500, seed=3, mv=.2):
    ln=n(sec); o=np.zeros(ln); rg=np.random.default_rng(seed)
    for i,f in enumerate(freqs):
        for c in (-.22,.22):
            lfo=1+0.0022*np.sin(2*np.pi*(0.05+0.02*i)*np.arange(ln)/SR+rg.random()*6)
            o+=saw(f*(2**(c/12))*lfo, sec, parts=14)*0.5
            o+=sine(f*(2**(c/12))*lfo, sec)*0.5
    o=lp_sweep(o,bright*(1-mv),bright*(1+mv))
    o=o/(np.max(np.abs(o))+1e-9)
    return fade(o,1.6,2.2)

def pluck(f, sec, bright=2600, decay=.5, seed=2):
    """Mechanical analog arp voice."""
    ln=n(sec); o=saw(f,sec,parts=18)*.7 + sine(f,sec)*.3
    env=expdec(ln,decay)
    o=lp(o*env, bright)
    return fade(o,.003,.02)

def piano(f, sec, seed=4, vel=1.0):
    """Felt-piano-ish additive with inharmonicity + a soft hammer thunk."""
    ln=n(sec); o=np.zeros(ln); B=0.0004
    for k in range(1,15):
        fk=f*k*np.sqrt(1+B*k*k)
        if fk>SR*0.45: break
        amp=(1.0/(k**1.45))*(1.0 if k%2 else .72)
        o+=np.sin(2*np.pi*fk*np.arange(ln)/SR + (k*0.7))*amp*expdec(ln, 1.9/ (1+0.26*k))
    th=lp(noise(min(sec,.05),seed)*expdec(n(min(sec,.05)),.008),1600)*0.16*vel
    o=o/(np.max(np.abs(o))+1e-9)*vel
    o[:len(th)]+=th
    return fade(o,.002,.12)

def pulse16(bpm, sec, f=55, bright=900, seed=5, accent=4, duty=.14):
    """Steady 16th pulse bed."""
    out=buf(sec); step=60.0/bpm/4.0; i=0; t=0.0
    while t<sec-step:
        v=1.0 if (i%accent)==0 else .55
        ln=n(min(duty,step*0.95))
        tone=(sine(f,min(duty,step*0.95))*.6+lp(noise(min(duty,step*0.95),seed+i),bright)*.4)
        add(out, fade(tone*expdec(ln,.045)*v,.001,.03), t)
        t+=step; i+=1
    return out

def tick(seed=9, bright=3800, lvl=1.0):
    ln=n(.035); t=lp(noise(.035,seed),bright)*expdec(ln,.006)
    return fade(t*lvl,.0005,.02)

def hit(sec=2.6, f0=90, f1=34, seed=11, body=1.0):
    """Low emphasis impact. Used six times in the whole film."""
    ln=n(sec); t=np.arange(ln)/SR
    sw=np.sin(2*np.pi*(f1+(f0-f1)*np.exp(-t*5.0))*t)
    sw*=expdec(ln,sec*0.34)
    nz=lp(noise(sec,seed),240)*expdec(ln,.10)*0.55
    o=np.tanh((sw*body+nz)*1.5)
    return fade(o/(np.max(np.abs(o))+1e-9),.001,.5)

def riser(sec=2.0, f0=200, f1=4200, seed=13):
    ln=n(sec); nz=noise(sec,seed)
    o=lp_sweep(hp(nz,f0), f0, f1)*np.linspace(0,1,ln)**2.0
    return fade(o/(np.max(np.abs(o))+1e-9),.05,.04)

def hiss(sec, lo=900, hi=7000, seed=17, shape=None):
    o=bp(noise(sec,seed),lo,hi)
    if shape is not None: o*=shape
    return o/(np.max(np.abs(o))+1e-9)

def air(sec, seed=19, lo=40, hi=320):
    """Low room/air bed - the 'ambience under everything' layer."""
    o=bp(noise(sec,seed),lo,hi)
    m=1+0.35*np.sin(2*np.pi*0.037*np.arange(n(sec))/SR)
    return (o*m)/(np.max(np.abs(o*m))+1e-9)

# ---------- utility ----------
def db(x, d): return x*(10**(d/20.0))
def stereo(l, r=None, width=1.0):
    if r is None: r=l.copy()
    m=(l+r)/2; s=(l-r)/2*width
    return np.stack([m+s, m-s], axis=1)
