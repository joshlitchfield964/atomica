import subprocess, os, sys
from PIL import Image, ImageDraw
B="/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/"
F=B+"deliver/renders/Tesla_Roadster_FILM_1080p.mp4"
Q=B+"qc/"
times=[float(x) for x in sys.argv[1].split(",")] if len(sys.argv)>1 else \
      [1.5,13,25,43.5,52,66,72,85,100,112,125,140,160,183,205,218,231,255,290,305,
       315,325,340,356,375,385,400,420,440,455,470,485,505,520,535,547,560,570,590,
       610,622,630,650,665,685,695]
cw,chh=480,270; cols=6; rows=(len(times)+cols-1)//cols
s=Image.new("RGB",(cw*cols,chh*rows),(8,8,10)); d=ImageDraw.Draw(s)
for i,t in enumerate(times):
    p=Q+"_q.png"
    if os.path.exists(p): os.remove(p)
    subprocess.run(["ffmpeg","-v","error","-ss",str(t),"-i",F,"-frames:v","1",
                    "-vf",f"scale={cw}:-2","-y",p],capture_output=True)
    x,y=(i%cols)*cw,(i//cols)*chh
    if os.path.exists(p):
        im=Image.open(p).convert("RGB"); im.thumbnail((cw,chh))
        s.paste(im,(x,y+(chh-im.height)//2))
    mm=int(t//60); ss=t%60
    d.text((x+6,y+6), f"{mm}:{ss:04.1f}", fill=(255,210,80))
s.save(Q+"film_sheet.png"); print("saved", s.size, len(times),"frames")
