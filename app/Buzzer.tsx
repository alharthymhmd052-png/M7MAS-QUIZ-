'use client'
export default function Buzzer({onPress,disabled,label='اضغط!'}:{onPress?:()=>void,disabled?:boolean,label?:string}){
 return <button onClick={onPress} disabled={disabled} aria-label="الجرس" className={`relative mx-auto block h-52 w-52 rounded-full transition-all active:translate-y-2 disabled:grayscale disabled:opacity-60 ${disabled?'':'idle'}`}
 style={{background:'radial-gradient(circle at 35% 30%,#ff9a8f,#ff5a5f 45%,#c5303a)',boxShadow:disabled?'0 6px 0 #7a1c22':'0 12px 0 #8f1f27,0 25px 40px rgba(255,90,95,.35),inset 0 -8px 14px rgba(0,0,0,.2)'}}>
 <span className="absolute inset-3 rounded-full border-4 border-white/25"/><span className="text-4xl font-black drop-shadow">{label}</span></button>}
