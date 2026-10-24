import {NextResponse} from 'next/server';import {createClient} from '@supabase/supabase-js'
const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
const ROUNDS=10
async function ai(system:string,user:string){const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY||'','anthropic-version':'2023-06-01'},
 body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-sonnet-4-6',max_tokens:500,system,messages:[{role:'user',content:user}]})});if(!r.ok)throw new Error('AI_FAILED');const j=await r.json();return JSON.parse((j.content?.[0]?.text||'').replace(/```json|```/g,'').trim())}
const bad=(error:string,s=400)=>NextResponse.json({error},{status:s})
export async function POST(req:Request){const b=await req.json();const s=db()
 try{
 if(b.action==='create'){const code=Math.random().toString(36).slice(2,7).toUpperCase()
  await s.from('rooms').insert({code,category:String(b.category).slice(0,30),difficulty:String(b.difficulty).slice(0,10)})
  const{data:p}=await s.from('players').insert({room_code:code,name:String(b.name).slice(0,14),avatar:b.avatar}).select().single()
  await s.from('rooms').update({host:p!.id}).eq('code',code);return NextResponse.json({code,pid:p!.id})}
 const{data:room}=await s.from('rooms').select('*').eq('code',b.code).single();if(!room)return bad('الغرفة غير موجودة',404)
 if(b.action==='join'){const{count}=await s.from('players').select('*',{count:'exact',head:true}).eq('room_code',b.code);if((count||0)>=8)return bad('الغرفة ممتلئة')
  const{data:p}=await s.from('players').insert({room_code:b.code,name:String(b.name).slice(0,14),avatar:b.avatar}).select().single();return NextResponse.json({code:b.code,pid:p!.id})}
 const{data:me}=await s.from('players').select('*').eq('id',b.pid).eq('room_code',b.code).single();if(!me)return bad('غير مصرح',403)
 if(b.action==='next'){if(room.host!==me.id)return bad('المضيف فقط',403)
  if(room.round>=ROUNDS){await s.from('rooms').update({status:'done'}).eq('code',b.code);return NextResponse.json({ok:1})}
  const q=await ai('أنت مولّد أسئلة مسابقات عربية. أعد JSON فقط: {"question":"...","answer":"...","aliases":["..."]}. السؤال قصير يُجاب شفهياً بكلمات قليلة، بلهجة سعودية/خليجية بسيطة أو فصحى حسب المناسب، وإجابته واحدة واضحة وصحيحة.',
   `الفئة: ${room.category}\nالمستوى: ${room.difficulty}\nلا تكرر هذه الأسئلة: ${JSON.stringify(room.used.slice(-40))}`)
  if(room.used.includes(q.question))return bad('تكرر السؤال، جرّب مرة ثانية')
  await s.from('secrets').upsert({code:b.code,answer:q.answer,aliases:q.aliases||[]})
  await s.from('rooms').update({status:'question',question:q.question,reveal:null,buzzed_by:null,failed:[],round:room.round+1,used:[...room.used,q.question]}).eq('code',b.code);return NextResponse.json({ok:1})}
 if(b.action==='buzz'){const{data}=await s.rpc('buzz',{p_code:b.code,p_pid:b.pid});return NextResponse.json({won:!!data})}
 if(b.action==='answer'){if(room.buzzed_by!==me.id||room.status!=='question')return bad('ليس دورك',403)
  const late=Date.now()-new Date(room.buzzed_at).getTime()>20000
  const{data:sec}=await s.from('secrets').select('*').eq('code',b.code).single()
  let ok=false;const text=String(b.text||'').slice(0,200)
  if(text&&!late){const v=await ai('قيّم إجابة لاعب في مسابقة. أعد JSON فقط: {"correct":true|false}. تجاهل اختلاف اللهجة والتشكيل والهمزات وأخطاء التعرف على الصوت البسيطة.',`السؤال: ${room.question}\nالإجابة الصحيحة: ${sec!.answer} (بدائل: ${(sec!.aliases||[]).join('، ')})\nإجابة اللاعب: ${text}`);ok=!!v.correct}
  if(ok){await s.from('players').update({score:me.score+10}).eq('id',me.id);await s.from('rooms').update({status:'reveal',reveal:sec!.answer,buzzed_by:null}).eq('code',b.code)}
  else{await s.from('players').update({cooldown_until:new Date(Date.now()+15000).toISOString()}).eq('id',me.id)
   const failed=[...room.failed,me.id];const{count}=await s.from('players').select('*',{count:'exact',head:true}).eq('room_code',b.code)
   await s.from('rooms').update(failed.length>=(count||1)?{status:'reveal',reveal:sec!.answer,buzzed_by:null,failed}:{buzzed_by:null,failed}).eq('code',b.code)}
  return NextResponse.json({correct:ok})}
 return bad('طلب غير صحيح')
 }catch(e:any){return bad(e.message==='AI_FAILED'?'تعذّر توليد السؤال. تأكد من مفتاح الذكاء الاصطناعي':'خطأ في الخادم',500)}}
