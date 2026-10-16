import sys, os, subprocess, json
sys.path.insert(0,'/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/build')
import edl
B="/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/"
FONT=B+"film/tesla-roadster/assets/fonts/JetBrainsMono-Medium.ttf"

# --- credit per source family (style_bible 5: source tag on FIRST use) ---
def credit(src):
    s=src.split("/")[-1]
    # video first: several clip filenames contain a publisher name that also
    # matches a stills rule (e.g. ..._teslarati_reaction_2160p.mp4)
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
    if "shacknews" in s:         return "FOOTAGE · TESLA / SHACKNEWS"
    if "teslarati_reaction" in s:return "FOOTAGE · TESLA"
    if "_tesla_track-mode" in s: return "FOOTAGE · @TESLA"
    if "sawyer" in s:            return "FOOTAGE · TESLA / @SAWYERMERRITT"
    if "drivetesla" in s:        return "FOOTAGE · TESLA / DRIVE TESLA"
    if "kanekoa" in s or "collinrugg" in s: return "FOOTAGE · TESLA"
    if "rushlane" in s:          return "FOOTAGE · TESLA / @RUSHLANE"
    if "alef" in s:              return "FOOTAGE · ALEF AERONAUTICS"
    if "5RRmepp7i5g" in s:       return "TESLA · 2017 UNVEIL"
    if "qt5p-_tE8d0" in s:       return "TESLA · OFFICIAL EVENT REPLAY"
    if "x_2110915963399135731" in s: return "FOOTAGE · TESLA"
    return None

def esc(t):
    return t.replace("\\","\\\\").replace(":","\\:").replace("'","\u2019")

first={}
for s in edl.EDL:
    if s["kind"]=="gfx": continue          # graphics carry their own footer credit
    c=credit(s["src"])
    if c and c not in first: first[c]=s["t"]

tags=sorted(first.items(), key=lambda kv: kv[1])
print("distinct credits:",len(tags))
for c,t in tags: print(f"  {t:7.2f}  {c}")

HOLD=3.4
parts=[]
for c,t in tags:
    parts.append(
      f"drawtext=fontfile='{FONT}':text='{esc(c)}':fontsize=17:fontcolor=0xA9B4C0@0.92:"
      f"x=96:y=h-54-22:shadowcolor=0x000000@0.75:shadowx=0:shadowy=2:"
      f"enable='between(t,{t:.2f},{t+HOLD:.2f})'")
chain=",".join(parts)
open(B+"build/tagchain.txt","w").write(chain)
print("chain len",len(chain))
