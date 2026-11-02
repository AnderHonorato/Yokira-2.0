import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Yokira 2.0 — Seu próximo universo',description:'Descubra animes, organize sua lista e compartilhe boas histórias na comunidade Yokira.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}
