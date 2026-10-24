import './globals.css';import {Cairo} from 'next/font/google';
const c=Cairo({subsets:['arabic','latin'],weight:['500','700','900'],variable:'--font-cairo'});
export const metadata={title:'محمس كويز'};
export default function L({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body className={c.variable}><main className="mx-auto max-w-md min-h-screen p-3 flex items-center">{children}</main></body></html>}
