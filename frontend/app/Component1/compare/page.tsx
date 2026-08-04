"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Screen, TabBar } from "../_lib/ipe-ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Result = {
  classification : { name: string; confidence: number };
  ppi            : { score: number; label: string };
  fis            : { speech: number; swallowing: number; mouth: number };
  visual_features: { erythema: number; ulceration: number; texture: number; physio: number };
  urgency        : { emoji: string; timeframe: string; color: string };
};

function ppiColor(p: number) {
  if (p <= 1) return "#00B4A0"; if (p <= 3) return "#7BC67E";
  if (p <= 5) return "#FFD166"; if (p <= 7.5) return "#F4845F";
  return "#E63946";
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ background:"rgba(13,33,55,0.06)", borderRadius:99, height:7, overflow:"hidden", flex:1 }}>
      <div style={{ width:`${value*100}%`, height:7, borderRadius:99, background:color, transition:"width 1s ease", boxShadow:`0 0 6px ${color}44` }}/>
    </div>
  );
}

function ChangeChip({ before, after, invert=false }: { before: number; after: number; invert?: boolean }) {
  const diff = after - before;
  const good = invert ? diff < 0 : diff > 0;
  const pct  = Math.abs(diff * 100).toFixed(0);
  if (Math.abs(diff) < 0.01) return <span style={{ fontSize:11, color:"#8FA3B1", fontWeight:600 }}>—</span>;
  return (
    <span style={{ fontSize:11, fontWeight:800, color:good?"#00B4A0":"#E63946", background:good?"rgba(0,180,160,0.1)":"rgba(230,57,70,0.1)", borderRadius:20, padding:"2px 8px" }}>
      {diff > 0 ? "↑" : "↓"}{pct}%
    </span>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const [beforeImg, setBeforeImg]   = useState<File|null>(null);
  const [afterImg, setAfterImg]     = useState<File|null>(null);
  const [beforePrev, setBeforePrev] = useState<string|null>(null);
  const [afterPrev, setAfterPrev]   = useState<string|null>(null);
  const [beforeRes, setBeforeRes]   = useState<Result|null>(null);
  const [afterRes, setAfterRes]     = useState<Result|null>(null);
  const [loading, setLoading]       = useState<"before"|"after"|"both"|null>(null);
  const [error, setError]           = useState<string|null>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef  = useRef<HTMLInputElement>(null);

  const pickImage = (side: "before"|"after") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]; if (!f) return;
      const u = URL.createObjectURL(f);
      if (side==="before") { setBeforeImg(f); setBeforePrev(u); setBeforeRes(null); }
      else                 { setAfterImg(f);  setAfterPrev(u);  setAfterRes(null); }
    };

  const analyzeOne = async (file: File, side: "before"|"after") => {
    setLoading(side); setError(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`${API}/predict`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      if (side==="before") setBeforeRes(data);
      else                  setAfterRes(data);
    } catch(e:any) { setError(e.message); }
    finally { setLoading(null); }
  };

  const analyzeAll = async () => {
    if (!beforeImg || !afterImg) return;
    setLoading("both"); setError(null);
    try {
      const fd1 = new FormData(); fd1.append("file", beforeImg);
      const fd2 = new FormData(); fd2.append("file", afterImg);
      const [r1, r2] = await Promise.all([
        fetch(`${API}/predict`, {method:"POST",body:fd1}).then(r=>r.json()),
        fetch(`${API}/predict`, {method:"POST",body:fd2}).then(r=>r.json()),
      ]);
      setBeforeRes(r1); setAfterRes(r2);
    } catch(e:any) { setError(e.message); }
    finally { setLoading(null); }
  };

  const ppiChange = beforeRes && afterRes ? beforeRes.ppi.score - afterRes.ppi.score : null;
  const improving = ppiChange !== null && ppiChange > 0;

  return (
    <Screen>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,#0D2137,#1A3550)`, padding:"env(safe-area-inset-top,44px) 20px 28px", overflow:"hidden", position:"relative", margin:"-20px -18px 16px" }}>
        <div style={{ position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none" }}/>
        <button onClick={()=>router.back()} style={{ width:38,height:38,borderRadius:19,border:"none",background:"rgba(255,255,255,0.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4 }}>IPE Framework</div>
        <h1 style={{ fontSize:26,fontWeight:800,color:"#fff",margin:"0 0 4px",letterSpacing:"-0.03em" }}>Before &amp; After</h1>
        <p style={{ fontSize:13,color:"rgba(255,255,255,0.6)",margin:0 }}>Compare two images to track your recovery</p>
      </div>

      {error && (
        <div style={{ background:"rgba(230,57,70,0.08)",border:"1px solid rgba(230,57,70,0.25)",borderRadius:14,padding:"10px 14px",marginBottom:14 }}>
          <p style={{ margin:0,color:"#E63946",fontSize:13,fontWeight:600 }}>{error}</p>
        </div>
      )}

      {/* Upload row */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
        {(["before","after"] as const).map(side=>{
          const prev = side==="before" ? beforePrev : afterPrev;
          const res  = side==="before" ? beforeRes  : afterRes;
          const file = side==="before" ? beforeImg  : afterImg;
          const ref  = side==="before" ? beforeRef  : afterRef;
          const isLoading = loading===side || loading==="both";
          const sideColor = side==="before" ? "#F4845F" : "#00B4A0";
          return (
            <div key={side}>
              <div style={{ fontSize:11,fontWeight:800,color:sideColor,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>
                {side==="before" ? "Before" : "After"}
              </div>
              <div onClick={()=>ref.current?.click()} style={{ border:`2px dashed ${prev?"transparent":sideColor+"44"}`, borderRadius:18, overflow:"hidden", cursor:"pointer", minHeight:160, display:"flex", alignItems:"center", justifyContent:"center", background:prev?"#000":`${sideColor}0d`, position:"relative" }}>
                {prev ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={prev} alt={side} style={{ width:"100%",height:160,objectFit:"cover",display:"block",opacity:isLoading?0.4:1 }}/>
                    {res && (
                      <div style={{ position:"absolute",bottom:6,left:6,right:6,background:"rgba(13,27,42,0.75)",backdropFilter:"blur(8px)",borderRadius:10,padding:"6px 10px" }}>
                        <div style={{ fontSize:16,fontWeight:900,color:ppiColor(res.ppi.score) }}>{res.ppi.score.toFixed(1)}<span style={{ fontSize:10,color:"rgba(255,255,255,0.6)" }}>/10</span></div>
                        <div style={{ fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:600 }}>{res.classification.name}</div>
                      </div>
                    )}
                    {isLoading && (
                      <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.3)" }}>
                        <div style={{ width:32,height:32,borderRadius:"50%",border:`3px solid ${sideColor}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite" }}/>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign:"center",padding:16 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:sideColor }}>Add {side} photo</div>
                  </div>
                )}
              </div>
              <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={pickImage(side)}/>
              {file && !res && (
                <button onClick={()=>analyzeOne(file,side)} disabled={isLoading}
                  style={{ width:"100%",marginTop:8,background:sideColor,color:"#fff",border:"none",borderRadius:12,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                  Analyze →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Analyze both */}
      {beforeImg && afterImg && !beforeRes && !afterRes && (
        <button onClick={analyzeAll} disabled={loading==="both"}
          style={{ width:"100%",background:"linear-gradient(135deg,#0D2137,#1A3550)",color:"#fff",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:16,boxShadow:"0 8px 24px rgba(13,33,55,0.25)" }}>
          {loading==="both" ? "Analyzing both images..." : "Analyze Both Images →"}
        </button>
      )}

      {/* Results comparison */}
      {beforeRes && afterRes && (
        <>
          <div style={{ background:improving?"rgba(0,180,160,0.08)":"rgba(230,57,70,0.08)", border:`1px solid ${improving?"rgba(0,180,160,0.25)":"rgba(230,57,70,0.25)"}`, borderRadius:18, padding:18, marginBottom:16, textAlign:"center" }}>
            <div style={{ fontSize:22,fontWeight:900,color:improving?"#00B4A0":"#E63946",letterSpacing:"-0.03em",marginBottom:4 }}>
              {improving ? `Pain reduced by ${ppiChange!.toFixed(1)} points` : `Pain increased by ${Math.abs(ppiChange!).toFixed(1)} points`}
            </div>
            <div style={{ fontSize:13,color:"#4A6278" }}>
              {beforeRes.ppi.score.toFixed(1)}/10 → {afterRes.ppi.score.toFixed(1)}/10
            </div>
            {improving && (
              <div style={{ marginTop:12,background:"rgba(0,180,160,0.1)",borderRadius:12,padding:"8px 16px",display:"inline-block" }}>
                <span style={{ fontSize:13,fontWeight:700,color:"#00B4A0" }}>
                  {((ppiChange!/beforeRes.ppi.score)*100).toFixed(0)}% improvement in pain score
                </span>
              </div>
            )}
          </div>

          <div style={{ background:"#fff",borderRadius:22,padding:20,boxShadow:"0 2px 16px rgba(13,33,55,0.08)",marginBottom:12 }}>
            <div style={{ fontSize:11,fontWeight:800,color:"#00B4A0",textTransform:"uppercase",letterSpacing:1,marginBottom:14 }}>Pain Score Comparison</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center" }}>
              <div style={{ textAlign:"center",background:"rgba(244,132,95,0.06)",borderRadius:14,padding:14 }}>
                <div style={{ fontSize:10,color:"#8FA3B1",fontWeight:700,marginBottom:4 }}>BEFORE</div>
                <div style={{ fontSize:36,fontWeight:900,color:ppiColor(beforeRes.ppi.score),letterSpacing:"-0.04em" }}>{beforeRes.ppi.score.toFixed(1)}</div>
                <div style={{ fontSize:11,color:ppiColor(beforeRes.ppi.score),fontWeight:600 }}>{beforeRes.ppi.label}</div>
              </div>
              <div style={{ fontSize:28,textAlign:"center" }}>→</div>
              <div style={{ textAlign:"center",background:"rgba(0,180,160,0.06)",borderRadius:14,padding:14 }}>
                <div style={{ fontSize:10,color:"#8FA3B1",fontWeight:700,marginBottom:4 }}>AFTER</div>
                <div style={{ fontSize:36,fontWeight:900,color:ppiColor(afterRes.ppi.score),letterSpacing:"-0.04em" }}>{afterRes.ppi.score.toFixed(1)}</div>
                <div style={{ fontSize:11,color:ppiColor(afterRes.ppi.score),fontWeight:600 }}>{afterRes.ppi.label}</div>
              </div>
            </div>
          </div>

          <div style={{ background:"#fff",borderRadius:22,padding:20,boxShadow:"0 2px 16px rgba(13,33,55,0.08)",marginBottom:12 }}>
            <div style={{ fontSize:11,fontWeight:800,color:"#00B4A0",textTransform:"uppercase",letterSpacing:1,marginBottom:16 }}>Visual Features Comparison</div>
            {([
              ["Erythema","erythema","#F4845F",true],
              ["Ulceration","ulceration","#FFD166",true],
              ["Texture","texture","#8B4513",true],
              ["Physio Filter","physio","#00B4A0",false],
            ] as [string,keyof Result["visual_features"],string,boolean][]).map(([label,key,color,lower])=>{
              const bv = beforeRes.visual_features[key];
              const av = afterRes.visual_features[key];
              return (
                <div key={key} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                    <span style={{ fontSize:13,fontWeight:600,color:"#0D2137" }}>{label}</span>
                    <ChangeChip before={bv} after={av} invert={lower}/>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 24px 1fr",gap:8,alignItems:"center" }}>
                    <MiniBar value={bv} color={"#F4845F"}/>
                    <div style={{ fontSize:10,color:"#8FA3B1",textAlign:"center" }}>→</div>
                    <MiniBar value={av} color={color}/>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",marginTop:3 }}>
                    <span style={{ fontSize:10,color:"#8FA3B1" }}>{(bv*100).toFixed(0)}%</span>
                    <span style={{ fontSize:10,color:"#8FA3B1" }}>{(av*100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background:"#fff",borderRadius:22,padding:20,boxShadow:"0 2px 16px rgba(13,33,55,0.08)",marginBottom:12 }}>
            <div style={{ fontSize:11,fontWeight:800,color:"#00B4A0",textTransform:"uppercase",letterSpacing:1,marginBottom:16 }}>Functional Impact Comparison</div>
            {([
              ["Speech","speech"],
              ["Swallowing","swallowing"],
              ["Mouth Opening","mouth"],
            ] as [string,keyof Result["fis"]][]).map(([label,key])=>{
              const bv = beforeRes.fis[key] as number;
              const av = afterRes.fis[key] as number;
              return (
                <div key={key} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                    <span style={{ fontSize:13,fontWeight:600,color:"#0D2137" }}>{label}</span>
                    <ChangeChip before={bv} after={av} invert={true}/>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 24px 1fr",gap:8,alignItems:"center" }}>
                    <MiniBar value={bv} color={"#F4845F"}/>
                    <div style={{ fontSize:10,color:"#8FA3B1",textAlign:"center" }}>→</div>
                    <MiniBar value={av} color={"#00B4A0"}/>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",marginTop:3 }}>
                    <span style={{ fontSize:10,color:"#8FA3B1" }}>Before: {(bv*100).toFixed(0)}%</span>
                    <span style={{ fontSize:10,color:"#8FA3B1" }}>After: {(av*100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background:`linear-gradient(135deg,${improving?"#00B4A0":"#E63946"},${improving?"#007A6E":"#C0392B"})`, borderRadius:22, padding:20, marginBottom:24, color:"#fff" }}>
            <div style={{ fontSize:11,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8,color:"rgba(255,255,255,0.7)" }}>Summary</div>
            <p style={{ margin:0,fontSize:14,lineHeight:1.7 }}>
              {improving
                ? `Progress: your pain score improved from ${beforeRes.ppi.score.toFixed(1)} to ${afterRes.ppi.score.toFixed(1)} — a ${((ppiChange!/beforeRes.ppi.score)*100).toFixed(0)}% reduction. Continue your current plan and attend your follow-up appointment.`
                : `Pain has increased from ${beforeRes.ppi.score.toFixed(1)} to ${afterRes.ppi.score.toFixed(1)}. Please contact your healthcare provider as soon as possible.`
              }
            </p>
            <button onClick={()=>router.push("/Component1/results/report")}
              style={{ marginTop:14,background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",backdropFilter:"blur(10px)" }}>
              Download Full Report
            </button>
          </div>
        </>
      )}

      {(beforeRes || afterRes) && (
        <button onClick={()=>{ setBeforeImg(null);setAfterImg(null);setBeforePrev(null);setAfterPrev(null);setBeforeRes(null);setAfterRes(null); }}
          style={{ width:"100%",background:"transparent",border:"1.5px solid rgba(13,33,55,0.15)",borderRadius:16,padding:"13px",fontSize:14,fontWeight:700,color:"#4A6278",cursor:"pointer",marginBottom:90 }}>
          + Try Different Images
        </button>
      )}

      <TabBar active="results"/>
    </Screen>
  );
}