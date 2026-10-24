'use client'
import {useEffect,useRef,useState} from 'react';import {useParams} from 'next/navigation';import {createClient} from '@supabase/supabase-js';import Buzzer from '../../Buzzer'
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export default function Room(){const{code}=useParams<{code:string}>()
 const[room,setRoom]=useState<any>(null),[players,setP]=useState<any[]>([]),[pid,setPid]=useState(''),[txt,setTxt]=useState(''),[mic,setMic]=useState('idle'),[left,setLeft]=useState(12),[err,setErr]=useState(''),[,tick]=useState(0)
 const rec=useRef<any>(null)
 const load=async()=>{const[a,b]=await Promise.all([sb.from('rooms').select('*').eq('code',code).single(),sb.from('players').select('*').eq('room_code',code).order('score',{ascending:false})]);setRoom(a.data);setP(b.data||[])}
 useEffect(()=>{const s=localStorage.getItem('m7:'+code);if(s)setPid(JSON.parse(s).pid);load()
  const ch=sb.channel('r'+code).on('postgres_changes',{event:'*',schema:'public',table:'rooms',filter:`code=eq.${code}`},load).on('postgres_changes',{event:'*',schema:'public',table:'players',filter:`room_code=eq.${code}`},load)
   .subscribe(st=>{if(st==='SUBSCRIBED')load()}) // refetch on (re)subscribe = reconnection handling
  const t=setInterval(()=>tick(x=>x+1),500);return()=>{sb.removeChannel(ch);clearInterval(t)}},[code])
 const call=async(action:string,extra:any={})=>{setErr('');const r=await fetch('/api/game',{method:'POST',body:JSON.stringify({action,code,pid,...extra})});const j=await r.json();if(!r.ok)setErr(j.error);return j}
 const me=players.find(p=>p.id===pid),mine=room?.buzzed_by===pid,cd=me?.cooldown_until?Math.max(0,Math.ceil((+new Date(me.cooldown_until)-Date.now())/1000)):0
 const taker=players.find(p=>p.id===room?.buzzed_by),isHost=room?.host===pid
 const submit=async(t:string)=>{if(!mine)return;try{rec.current?.stop()}catch{};setTxt('');await call('answer',{text:t})}
 useEffect(()=>{if(!mine){setMic('idle');return}
  const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){setMic('unsupported');return}
  const r=new SR();r.lang='ar-SA';r.interimResults=false;r.onstart=()=>setMic('on');r.onerror=(e:any)=>setMic(e.error==='not-allowed'?'denied':'idle')
  r.onresult=(e:any)=>submit(e.results[0][0].transcript);try{r.start()}catch{};rec.current=r;return()=>{try{r.stop()}catch{}}},[mine])
 useEffect(()=>{if(!mine||!room?.buzzed_at)return;const l=Math.max(0,12-Math.floor((Date.now()-+new Date(room.buzzed_at))/1000));if(l!==left)setLeft(l);if(l===0)submit('')})
 if(!room)return <div className="panel w-full text-center font-bold animate-pulse">جاري التحميل…</div>
 const micTxt:any={on:'🎙️ الميكروفون يسمعك',denied:'🚫 الميكروفون مرفوض، اكتب إجابتك',unsupported:'المتصفح لا يدعم الصوت، اكتب إجابتك',idle:'…'}
 return <div className="panel w-full space-y-4">
  <div className="flex items-center justify-between"><span className="text-2xl font-black text-sun">محمس كويز</span><span dir="ltr" className="inset font-black tracking-widest text-aqua">{code}</span></div>
  {room.status==='lobby'&&<><p className="text-center font-bold">شارك الكود مع ربعك — {room.category}</p>
   {isHost?<button className="btn-y w-full" disabled={players.length<2} onClick={()=>call('next')}>{players.length<2?'ننتظر لاعب ثاني…':'ابدأ اللعبة'}</button>:<p className="text-center text-white/70">ننتظر المضيف يبدأ…</p>}</>}
  {room.status==='question'&&<><div className="inset text-center text-xl font-black leading-relaxed min-h-[5rem] grid place-items-center">{room.question}</div>
   <p className="text-center text-sm text-white/60">السؤال {room.round} من 10</p>
   {mine?<div className="space-y-2 pop"><div className="text-center font-black text-coral">دورك! {left}ث — {micTxt[mic]}</div>
    <div className="flex gap-2"><input className="input" value={txt} onChange={e=>setTxt(e.target.value)} placeholder="أو اكتب إجابتك"/><button className="btn-c" onClick={()=>submit(txt)}>أرسل</button></div></div>
   :<><Buzzer disabled={!!room.buzzed_by||cd>0||room.failed?.includes(pid)} label={cd>0?cd+'ث':taker?'🔒':'اضغط!'} onPress={()=>call('buzz')}/>
    <p className="text-center font-bold h-6">{taker?`${taker.avatar} ${taker.name} يجاوب…`:room.failed?.includes(pid)?'جاوبت غلط، الدور للبقية':''}</p></>}</>}
  {room.status==='reveal'&&<><div className="inset text-center"><div className="text-white/60 text-sm">الإجابة</div><div className="text-3xl font-black text-sun pop">{room.reveal}</div></div>{isHost?<button className="btn-y w-full" onClick={()=>call('next')}>{room.round>=10?'النتيجة النهائية':'السؤال التالي'}</button>:<p className="text-center text-white/70">ننتظر المضيف…</p>}</>}
  {room.status==='done'&&<h2 className="text-center text-3xl font-black text-sun pop">🏆 {players[0]?.name} فاز!</h2>}
  <ul className="space-y-2">{players.map(p=><li key={p.id} className={`inset flex items-center gap-3 font-bold ${p.id===room.buzzed_by?'ring-2 ring-coral':''}`}><span className="text-2xl">{p.avatar}</span><span className="flex-1">{p.name}{p.id===pid&&' (أنت)'}{p.id===room.buzzed_by&&' 🎙️'}</span><span className="text-sun text-xl font-black">{p.score}</span></li>)}</ul>
  {err&&<p role="alert" className="text-center font-bold text-coral">{err}</p>}</div>}
