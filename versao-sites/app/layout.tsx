import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Yokira — Seu próximo universo',description:'Descubra animes, organize sua lista e compartilhe boas histórias na comunidade Yokira.',icons:{icon:[{url:'/favicon.ico',sizes:'any'},{url:'/marca/emblema-32.png',sizes:'32x32',type:'image/png'}],apple:{url:'/marca/emblema-180.png',sizes:'180x180',type:'image/png'}}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}
