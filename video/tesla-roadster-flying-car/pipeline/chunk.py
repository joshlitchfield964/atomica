"""Chunked final encode. Background processes do not survive a shell call here,
so the delivery encode is budgeted into pieces and concatenated."""
import sys, os, subprocess, json
sys.path.insert(0,'/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/build')
import edl
B="/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/"
FONT=B+"film/tesla-roadster/assets/fonts/JetBrainsMono-Medium.ttf"
OUT=B+"build/chunks/"; os.makedirs(OUT,exist_ok=True)
TOTAL=700.108
N=7
BOUNDS=[round(TOTAL*i/N,3) for i in range(N+1)]

def credit(src):
    s=src.split("/")[-1]
    if s.startswith(("x_","yt_","videopress_")):
        if "shacknews" in s:         return "FOOTAGE · TESLA / SHACKNEWS"
        if "_tesla_track-mode" in s: return "FOOTAGE · @TESLA"
        if "sawyer" in s:            return "FOOTAGE · TESLA / @SAWYERMERRITT"
        if "drivetesla" in s:        return "FOOTAGE · TESLA / DRIVE TESLA"
        if "rushlane" in s:          return "FOOTAGE · TESLA / @RUSHLANE"
        if "alef" in s:              return "FOOTAGE · ALEF AERONAUTICS"
        if "5RRmepp7i5g" in s:       return "TESLA · 2017 UNVEIL"
        if "qt5p-_tE8d0" in s:       return "TESLA · OFFICIAL EVENT REPLAY"
        return "FOOTAGE · TESLA"
    if "motortrend" in s:        return "PHOTOGRAPH · MOTORTREND"
    if "official_tesla" in s:    return "PHOTOGRAPH · TESLA"
    if "teslarati" in s:         return "PHOTOGRAPH · TESLARATI"
    if "gizmodo" in s:           return "FRAME · TESLA VIA GIZMODO"
    if "nypost" in s:            return "PHOTOGRAPH · NEW YORK POST"
    if "commons" in s:           return "WIKIMEDIA COMMONS · CC"
    return None

first={}
for s in edl.EDL:
    if s["kind"]=="gfx": continue
    c=credit(s["src"])
    if c and c not in first: first[c]=s["t"]
TAGS=sorted(first.items(), key=lambda kv: kv[1])
HOLD=3.4

def chain_for(t0,t1):
    parts=[]
    for c,t in TAGS:
        a,b=t,t+HOLD
        if b<t0 or a>t1: continue
        parts.append(
          f"drawtext=fontfile='{FONT}':text='{c}':fontsize=17:fontcolor=0xA9B4C0@0.92:"
          f"x=96:y=h-54-22:shadowcolor=0x000000@0.75:shadowx=0:shadowy=2:"
          f"enable='between(t,{max(0,a-t0):.2f},{b-t0:.2f})'")
    return ",".join(parts) if parts else "null"

def do(k):
    t0,t1=BOUNDS[k],BOUNDS[k+1]; d=round(t1-t0,3)
    out=OUT+f"c{k}.mp4"
    if os.path.exists(out):
        print("exists",out); return
    cmd=["ffmpeg","-v","error","-y","-ss",str(t0),"-i",B+"build/picture_raw.mp4",
         "-t",str(d),"-filter_complex",f"[0:v]{chain_for(t0,t1)}[v]","-map","[v]",
         "-an","-c:v","libx264","-preset","medium","-crf","18","-profile:v","high",
         "-level","4.2","-pix_fmt","yuv420p","-g","60",out]
    r=subprocess.run(cmd,capture_output=True,text=True)
    print(("ok " if r.returncode==0 else "FAIL ")+out, r.stderr[-300:] if r.returncode else "")

if __name__=="__main__":
    for k in [int(x) for x in sys.argv[1].split(",")]:
        do(k)
