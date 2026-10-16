"""Per-shot renderer. One ffmpeg job per shot, hash-cached, concatenated at the end.
Every shot gets the same base grade, grain and vignette so the film reads as one piece."""
import hashlib, json, os, subprocess, sys

ROOT="/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/"
ASSETS=ROOT+"pack_x/tesla-roadster/assets/"
OUT=ROOT+"build/shots/"
W,H,FPS=1920,1080,30
os.makedirs(OUT,exist_ok=True)

# --- unified look (style_bible section 1) -------------------------------------
# cool technical: teal-lifted shadows, firm S-curve, restrained saturation
GRADE = ("eq=contrast=1.085:saturation=0.86:gamma=0.985,"
         "curves=r='0/0.012 0.25/0.225 0.75/0.775 1/0.985':"
               "g='0/0.016 0.25/0.238 0.75/0.784 1/0.99':"
               "b='0/0.030 0.25/0.262 0.75/0.800 1/1'")
VIG   = "vignette=angle=PI/5.2:x0=w/2:y0=h/2"
def grain(amount=5):
    return f"noise=alls={amount}:allf=t+u"

def _mk_kb(d, kb):
    """Ken Burns on a still: eased zoom + drift. zoompan runs at FPS."""
    n=max(1,int(round(d*FPS)))
    z0,z1=kb.get("z0",1.0),kb.get("z1",1.06)
    px,py=kb.get("px",0.5),kb.get("py",0.5)
    # ease in-out so it never looks linear
    e=f"(1-cos(PI*min(on/{n-1 if n>1 else 1},1)))/2"
    z=f"{z0}+({z1}-{z0})*{e}"
    # pan so the focal point stays put while scaling
    x=f"(iw-iw/zoom)*{px}"; y=f"(ih-ih/zoom)*{py}"
    return (f"scale=2560:-2,zoompan=z='{z}':x='{x}':y='{y}':d={n}:s={W}x{H}:fps={FPS}")

def build_filter(s, d):
    kind=s["kind"]; parts=[]
    if kind=="still":
        if s.get("crop"): parts.append("crop={}:{}:{}:{}".format(*s["crop"]))
        parts.append(_mk_kb(d, s.get("kb",{})))
    else:
        if s.get("crop"): parts.append("crop={}:{}:{}:{}".format(*s["crop"]))
        parts.append(f"scale={W}:{H}:force_original_aspect_ratio=increase")
        parts.append(f"crop={W}:{H}")
        parts.append(f"fps={FPS}")
        kb=s.get("kb")
        if kb:  # gentle reframe on static-camera clips only
            parts.append(_mk_kb(d, kb))
    parts.append(f"setsar=1,format=yuv420p")
    return ",".join(parts)

def archive_chain(s, d, srcidx=0):
    """Framed archive: blurred darkened plate + inset with a bone border.
    Used for every sub-HD source so nothing is upscaled past what it supports."""
    inner=int(W*0.77)//2*2
    base=build_filter(s,d)
    return (
      f"[{srcidx}:v]{base},split=2[bg][fg];"
      f"[bg]scale={W}:{H},boxblur=28:2,eq=brightness=-0.22:saturation=0.45,"
      f"{GRADE}[bgx];"
      f"[fg]scale={inner}:-2,pad=iw+6:ih+6:3:3:color=0xE9E7E2,{GRADE}[fgx];"
      f"[bgx][fgx]overlay=(W-w)/2:(H-h)/2-18[v0];"
      f"[v0]{grain(4)},{VIG}[vout]"
    )

def full_chain(s, d, srcidx=0):
    return (f"[{srcidx}:v]{build_filter(s,d)},{GRADE},{grain(5)},{VIG}[vout]")

def shot_key(s,d):
    return hashlib.sha1(json.dumps([s,d,W,H,FPS,GRADE],sort_keys=True).encode()).hexdigest()[:16]

def render(s, d, force=False):
    key=shot_key(s,d); out=OUT+f"{s['id']}_{key}.mp4"
    if os.path.exists(out) and not force: return out,True
    for old in os.listdir(OUT):
        if old.startswith(s["id"]+"_"): os.remove(OUT+old)
    if s["kind"]=="gfx":
        src=s["src"]
        cmd=["ffmpeg","-v","error","-y","-ss",str(s.get("in",0)),"-i",src,
             "-vf",f"fps={FPS},scale={W}:{H},setsar=1,tpad=stop_mode=clone:stop_duration=6,format=yuv420p",
             "-t",str(d),
             "-an","-c:v","libx264","-preset","medium","-crf","17","-pix_fmt","yuv420p",out]
    else:
        src=ASSETS+s["src"]
        chain = archive_chain(s,d) if s.get("treat")=="archive" else full_chain(s,d)
        if s["kind"]=="still":
            cmd=["ffmpeg","-v","error","-y","-loop","1","-framerate",str(FPS),"-t",str(d),"-i",src,
                 "-filter_complex",chain,"-map","[vout]","-t",str(d),
                 "-an","-c:v","libx264","-preset","medium","-crf","17","-pix_fmt","yuv420p","-r",str(FPS),out]
        else:
            cmd=["ffmpeg","-v","error","-y","-ss",str(s.get("in",0)),"-i",src,"-t",str(d),
                 "-filter_complex",chain,"-map","[vout]","-t",str(d),
                 "-an","-c:v","libx264","-preset","medium","-crf","17","-pix_fmt","yuv420p","-r",str(FPS),out]
    r=subprocess.run(cmd,capture_output=True,text=True)
    if r.returncode!=0:
        print("FAIL",s["id"],r.stderr[-700:]); return None,False
    return out,False

if __name__=="__main__":
    tests=[
      {"id":"T1","kind":"still","src":"images/event_site_aerial_night_motortrend.jpg",
       "kb":{"z0":1.0,"z1":1.07,"px":0.5,"py":0.45},"treat":"full"},
      {"id":"T2","kind":"video","src":"video/x_2110901625007092065_shacknews_barrel-roll_1080p.mp4",
       "in":12.0,"treat":"full"},
      {"id":"T3","kind":"video","src":"video/yt_5RRmepp7i5g_Tesla Semi & Roadster Unveil.mp4",
       "in":1575.0,"treat":"archive"},
    ]
    for t in tests:
        p,c=render(t,3.0)
        print(("cached " if c else "rendered ")+str(p))
