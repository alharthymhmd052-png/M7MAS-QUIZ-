'use client'
import {useState} from 'react';import {useRouter} from 'next/navigation';import Buzzer from './Buzzer'
const CATS=[['⚽','كرة القدم'],['🏆','الدوري السعودي'],['🌍','كأس العالم'],['🧠','ثقافة عامة'],['🧩','ألغاز'],['🎌','أنمي'],['🎬','أفلام'],['🎮','ألعاب'],['🔬','علوم'],['📜','تاريخ']]
const AV=['🦁','🦅','🐪','🐺','🦊','🐯','🦄','🐙']
export default function Home(){const r=useRouter()
 const[name,setName]=useState(''),[av,setAv]=useState('🦁'),[cat,setCat]=useState('كرة القدم'),[diff,setDiff]=useState('متوسط'),[code,setCode]=useState(''),[err,setErr]=useState(''),[busy,setB]=useState(false)
 async function go(action:'create'|'join'){setErr('');if(!name.trim())return setErr('اكتب اسمك أول');setB(true)
  const res=await fetch('/api/game',{method:'POST',body:JSON.stringify({action,name,avatar:av,category:cat,difficulty:diff,code})});const j=await res.json();setB(false)
  if(!res.ok)return setErr(j.error||'صار خطأ، جرّب مرة ثانية');localStorage.setItem('m7:'+j.code,JSON.stringify({pid:j.pid}));r.push('/room/'+j.code)}
 return <div className="panel w-full space-y-4">
  <h1 className="text-center text-5xl font-black text-sun drop-shadow-[0_4px_0_#c79a00]">محمس <span className="text-aqua drop-shadow-[0_4px_0_#119a91]">كويز</span></h1>
  <p className="text-center text-white/70 font-bold -mt-2">أسرع واحد يضغط… ويجاوب بصوته!</p>
  <Buzzer label="جاوب!"/>
  <div className="inset flex gap-2 justify-center flex-wrap">{AV.map(a=><button key={a} onClick={()=>setAv(a)} aria-label={a} className={`text-2xl h-11 w-11 rounded-xl transition ${av===a?'bg-sun/30 ring-2 ring-sun scale-110':'hover:bg-white/10'}`}>{a}</button>)}</div>
  <input className="input" placeholder="اسمك" value={name} maxLength={14} onChange={e=>setName(e.target.value)}/>
  <div className="grid grid-cols-2 gap-2">{CATS.map(([i,c])=><button key={c} data-on={cat===c} onClick={()=>setCat(c)} className="chip">{i} {c}</button>)}</div>
  <div className="grid grid-cols-3 gap-2">{['سهل','متوسط','صعب'].map(d=><button key={d} data-on={diff===d} onClick={()=>setDiff(d)} className="chip">{d}</button>)}</div>
  <button className="btn-y w-full" disabled={busy} onClick={()=>go('create')}>{busy?'جاري التجهيز…':'أنشئ غرفة'}</button>
  <div className="flex gap-2"><input className="input" dir="ltr" placeholder="كود الغرفة" maxLength={5} value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/><button className="btn-c shrink-0" disabled={busy||code.length<5} onClick={()=>go('join')}>ادخل</button></div>
  {err&&<p role="alert" className="text-center font-bold text-coral">{err}</p>}</div>}
