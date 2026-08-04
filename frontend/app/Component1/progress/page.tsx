"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, FONT, Glass, Screen, TabBar, loadResult, type IpeResult } from "../_lib/ipe-ui";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Visit = {
  id: string;
  date: string;
  classification: string;
  ppi: number;
  fis_speech: number;
  fis_swallow: number;
  fis_mouth: number;
  erythema: number;
  ulceration: number;
  texture: number;
};

function loadVisits(): Visit[] {
  try {
    const raw = localStorage.getItem("ipe_visits");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveVisits(visits: Visit[]) {
  try { localStorage.setItem("ipe_visits", JSON.stringify(visits)); } catch {}
}

function resultToVisit(r: IpeResult): Visit {
  return {
    id: Date.now().toString(),
    date: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }),
    classification: r.classification.name,
    ppi: r.ppi.score,
    fis_speech: r.fis.speech,
    fis_swallow: r.fis.swallowing,
    fis_mouth: r.fis.mouth,
    erythema: r.visual_features.erythema,
    ulceration: r.visual_features.ulceration,
    texture: r.visual_features.texture,
  };
}

function LineChart({ values, color, height=60, width=300 }: { values:number[]; color:string; height?:number; width?:number }) {
  if (values.length < 2) return null;
  const mn=Math.min(...values); const mx=Math.max(...values); const range=mx-mn||1;
  const pts = values.map((v,i)=>{
    const x=(i/(values.length-1))*(width-20)+10;
    const y=height-((v-mn)/range)*(height-16)-8;
    return [x,y];
  });
  const d = pts.map((p,i)=>`${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ");
  const area = `${d} L${pts[pts.length-1][0]},${height} L${pts[0][0]},${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id={`lg${color.replace(/[^a-z0-9]/gi,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#lg${color.replace(/[^a-z0-9]/gi,"")})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="4" fill={color} stroke="#fff" strokeWidth="2"/>
      ))}
    </svg>
  );
}

function Trend({ current, previous, lower=true }: { current:number; previous:number; lower?:boolean }) {
  const diff = current - previous;
  const good = lower ? diff < 0 : diff > 0;
  const arrow = diff < 0 ? "↓" : diff > 0 ? "↑" : "→";
  const color = good ? C.sev[0] : diff===0 ? C.ink3 : C.sev[3];
  return (
    <span style={{ fontSize:11, fontWeight:700, color, background:`${color}12`, borderRadius:20, padding:"2px 8px" }}>
      {arrow} {Math.abs(diff*100).toFixed(0)}%
    </span>
  );
}

export default function ProgressPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [current, setCurrent] = useState<IpeResult|null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = loadResult();
    setCurrent(r);
    setVisits(loadVisits());
  }, []);

  const saveCurrentVisit = async () => {
    if (!current) return;
    setSaving(true);
    const patientId = localStorage.getItem("patient_id") ?? "guest";
    try {
      const res = await fetch(`${API}/progress/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          class_name: current.classification.name,
          ppi: current.ppi.score,
          fis_speech: current.fis.speech,
          fis_swallow: current.fis.swallowing,
          fis_mouth: current.fis.mouth,
          erythema: current.visual_features.erythema,
          ulceration: current.visual_features.ulceration,
          texture: current.visual_features.texture,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("Save failed");
      const v = resultToVisit(current);
      v.id = data.id?.toString() ?? v.id;
      const updated = [...visits, v];
      setVisits(updated);
      saveVisits(updated);
      setSaved(true);
    } catch (e) {
      const v = resultToVisit(current);
      const updated = [...visits, v];
      setVisits(updated);
      saveVisits(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Clear all visit history?")) {
      setVisits([]); saveVisits([]); setSaved(false);
    }
  };

  const ppiValues    = visits.map(v=>v.ppi);
  const speechValues = visits.map(v=>v.fis_speech);
  const eryValues    = visits.map(v=>v.erythema);
  const hasHistory   = visits.length >= 2;

  const ppiColor = (p:number) => p<=1?C.sev[0]:p<=3?C.sev[1]:p<=5?C.sev[2]:p<=7.5?C.sev[3]:C.sev[4];
  const ppiLabel = (p:number) => p<=1?"No Pain":p<=3?"Mild":p<=5?"Moderate":p<=7.5?"Severe":"Critical";
  const clsColor = (n:string) => ({"Normal":C.sev[0],"Variation from Normal":C.sev[1],"OPMD":C.sev[2],"Oral Cancer":C.sev[3]} as any)[n]??C.teal;

  let tri: string|null = null;
  let recDate: string|null = null;
  if (visits.length >= 2) {
    const first=visits[0]; const last=visits[visits.length-1];
    const days = visits.length > 1 ? (visits.length-1)*14 : 14;
    const rate = (first.ppi - last.ppi) / days;
    if (rate > 0) {
      tri = `Pain reducing at ${(rate*7).toFixed(2)} pts/week`;
      const daysLeft = last.ppi / rate;
      const d = new Date(); d.setDate(d.getDate()+Math.round(daysLeft));
      recDate = d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
    } else if (rate < 0) {
      tri = `Pain increasing at ${(Math.abs(rate)*7).toFixed(2)} pts/week`;
    } else {
      tri = "Pain level stable";
    }
  }

  return (
    <Screen>
      <div style={{ padding:"env(safe-area-inset-top,44px) 20px 0", fontFamily:FONT }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:C.ink, margin:"0 0 4px", letterSpacing:"-0.03em" }}>Recovery Journey</h1>
            <p style={{ fontSize:13, color:C.ink3, margin:0 }}>{visits.length} visit{visits.length!==1?"s":""} recorded</p>
          </div>
          {visits.length>0&&(
            <button onClick={handleClearHistory} style={{ background:"rgba(230,57,70,0.08)", border:"none", borderRadius:12, padding:"7px 12px", fontSize:11, fontWeight:700, color:C.sev[4], cursor:"pointer" }}>
              Clear
            </button>
          )}
        </div>

        {current && !saved && (
          <div style={{ background:`${C.teal}08`, border:`1.5px solid ${C.teal}30`, borderRadius:20, padding:18, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.teal, marginBottom:6 }}>Save current analysis as a visit?</div>
            <div style={{ fontSize:12, color:C.ink3, marginBottom:12 }}>
              {current.classification.name} · PPI {current.ppi.score.toFixed(1)}/10 · {new Date().toLocaleDateString()}
            </div>
            <button onClick={saveCurrentVisit} disabled={saving} style={{ background:`linear-gradient(135deg,${C.teal},${C.tealDark})`, border:"none", borderRadius:14, padding:"12px 20px", fontSize:13, fontWeight:700, color:"#fff", cursor: saving ? "default" : "pointer", width:"100%", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "+ Add to Progress History"}
            </button>
          </div>
        )}

        {saved && (
          <div style={{ background:`${C.sev[0]}12`, border:`1px solid ${C.sev[0]}30`, borderRadius:16, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.sev[0] }}>Visit saved to your history!</span>
          </div>
        )}

        {hasHistory ? (
          <>
            <div style={{ background:C.bgWhite, borderRadius:20, padding:20, marginBottom:14, boxShadow:"0 2px 16px rgba(13,33,55,0.07)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:C.ink }}>Pain Score (PPI)</div>
                  <div style={{ fontSize:11, color:C.ink3 }}>Over time</div>
                </div>
                {visits.length>=2&&(
                  <Trend current={visits[visits.length-1].ppi} previous={visits[visits.length-2].ppi} lower={true}/>
                )}
              </div>
              <div style={{ overflowX:"auto" }}>
                <LineChart values={ppiValues} color={ppiColor(visits[visits.length-1].ppi)} width={Math.max(300, visits.length*80)} height={80}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                {visits.map((v,i)=>(
                  <div key={v.id} style={{ textAlign:"center", fontSize:9, color:C.ink3 }}>
                    <div style={{ fontWeight:800, color:ppiColor(v.ppi), fontSize:12 }}>{v.ppi.toFixed(1)}</div>
                    V{i+1}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:C.bgWhite, borderRadius:20, padding:20, marginBottom:14, boxShadow:"0 2px 16px rgba(13,33,55,0.07)" }}>
              <div style={{ fontSize:15, fontWeight:800, color:C.ink, marginBottom:4 }}>Functional Impact (FIS)</div>
              <div style={{ fontSize:11, color:C.ink3, marginBottom:16 }}>Speech impairment over time</div>
              <div style={{ overflowX:"auto" }}>
                <LineChart values={speechValues} color={C.teal} width={Math.max(300, visits.length*80)} height={70}/>
              </div>
              {visits.length>=2&&(
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
                  <span style={{ fontSize:12, color:C.ink3 }}>Speech:</span>
                  <Trend current={visits[visits.length-1].fis_speech} previous={visits[visits.length-2].fis_speech} lower={true}/>
                </div>
              )}
            </div>

            <div style={{ background:C.bgWhite, borderRadius:20, padding:20, marginBottom:14, boxShadow:"0 2px 16px rgba(13,33,55,0.07)" }}>
              <div style={{ fontSize:15, fontWeight:800, color:C.ink, marginBottom:4 }}>Erythema (Redness)</div>
              <div style={{ fontSize:11, color:C.ink3, marginBottom:16 }}>Inflammation reduction tracking</div>
              <div style={{ overflowX:"auto" }}>
                <LineChart values={eryValues} color={C.sev[3]} width={Math.max(300, visits.length*80)} height={70}/>
              </div>
            </div>

            {tri && (
              <div style={{ background:C.bgWhite, borderRadius:20, padding:20, marginBottom:14, boxShadow:"0 2px 16px rgba(13,33,55,0.07)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.teal, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Treatment Response</div>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:4 }}>{tri}</div>
                    {recDate&&<div style={{ fontSize:12, color:C.ink3 }}>Predicted recovery: <strong style={{ color:C.sev[0] }}>{recDate}</strong></div>}
                  </div>
                </div>
              </div>
            )}

            <div style={{ fontSize:15, fontWeight:800, color:C.ink, marginBottom:12 }}>Visit History</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
              {[...visits].reverse().map((v,i)=>{
                const pc=ppiColor(v.ppi); const cc=clsColor(v.classification);
                const isLatest=i===0;
                return (
                  <div key={v.id} style={{ background:C.bgWhite, borderRadius:18, padding:18, boxShadow:"0 2px 12px rgba(13,33,55,0.07)", borderLeft:`4px solid ${pc}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:C.ink3 }}>Visit {visits.length-i} · {v.date}</span>
                          {isLatest&&<span style={{ background:C.tealLight, color:C.teal, fontSize:10, fontWeight:700, borderRadius:20, padding:"2px 8px" }}>Latest</span>}
                        </div>
                        <div style={{ fontSize:15, fontWeight:800, color:cc }}>{v.classification}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:28, fontWeight:900, color:pc, lineHeight:1, letterSpacing:"-0.03em" }}>{v.ppi.toFixed(1)}</div>
                        <div style={{ fontSize:10, color:C.ink3 }}>/10 PPI</div>
                        <div style={{ fontSize:11, fontWeight:700, color:pc }}>{ppiLabel(v.ppi)}</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                      {[["Speech",(v.fis_speech*100).toFixed(0)+"%"],["Swallow",(v.fis_swallow*100).toFixed(0)+"%"],["Erythema",(v.erythema*100).toFixed(0)+"%"]].map(([l,val])=>(
                        <div key={l} style={{ background:"rgba(13,33,55,0.04)", borderRadius:10, padding:"8px 10px" }}>
                          <div style={{ fontSize:11, color:C.ink3 }}>{l}</div>
                          <div style={{ fontSize:14, fontWeight:800, color:C.ink }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ background:C.bgWhite, borderRadius:20, padding:"40px 24px", textAlign:"center", marginBottom:24, boxShadow:"0 2px 16px rgba(13,33,55,0.07)" }}>
            <div style={{ fontSize:17, fontWeight:800, color:C.ink, marginBottom:8 }}>Your Journey Starts Here</div>
            <div style={{ fontSize:13, color:C.ink3, lineHeight:1.6, marginBottom:20 }}>
              Upload and analyze your first image, then save it here to start tracking your recovery over time. Charts will appear once you have 2+ visits.
            </div>
            <button onClick={()=>router.push("/Component1")}
              style={{ background:`linear-gradient(135deg,${C.teal},${C.tealDark})`, border:"none", borderRadius:14, padding:"13px 28px", fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer", fontFamily:FONT, boxShadow:`0 8px 24px ${C.teal}44` }}>
              Analyze First Image →
            </button>
          </div>
        )}

        <p style={{ textAlign:"center", fontSize:11, color:C.ink3, lineHeight:1.6, marginBottom:16 }}>
          Progress data is saved on this device only.<br/>Show these charts to your doctor at your next visit.
        </p>
      </div>
      <TabBar active="progress"/>
    </Screen>
  );
}