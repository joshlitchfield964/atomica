import sys, os, subprocess, concurrent.futures as cf, time
sys.path.insert(0,'/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/build')
import edl, shot
B="/tmp/claude-0/-home-user-atomica/e15b684b-c126-5141-91b7-b79bfd6b6ee8/scratchpad/"
sh=edl.EDL
jobs=[]
for i,s in enumerate(sh):
    d = (sh[i+1]["t"] if i+1<len(sh) else edl.END) - s["t"]
    s=dict(s); s["id"]=f"S{i:03d}"
    jobs.append((s, round(d,3)))
print("jobs",len(jobs),"total",round(sum(d for _,d in jobs),2),"s")

t0=time.time(); done=[0]
def run(j):
    s,d=j
    p,cached=shot.render(s,d)
    done[0]+=1
    if done[0]%20==0: print(f"  {done[0]}/{len(jobs)}  {time.time()-t0:.0f}s",flush=True)
    return (s["id"],p,d)

with cf.ThreadPoolExecutor(max_workers=4) as ex:
    res=list(ex.map(run, jobs))
fails=[r for r in res if r[1] is None]
print("rendered",len(res)-len(fails),"failed",len(fails))
for f in fails[:10]: print("  FAIL",f[0])
res.sort(key=lambda r:r[0])
with open(B+"build/concat.txt","w") as f:
    for _id,p,d in res:
        if p: f.write(f"file '{p}'\n")
print("concat list written")
