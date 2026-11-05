import type { Metadata } from 'next';
import './globals.css';
import './efeitos-visuais.css';
export const metadata:Metadata={title:'Yokira',description:'Catálogo de animes, filmes e séries. Lista pessoal, comunidade e salas de exibição.',icons:{icon:[{url:'/favicon.ico',sizes:'any'},{url:'/marca/emblema-32.png',sizes:'32x32',type:'image/png'}],apple:{url:'/marca/emblema-180.png',sizes:'180x180',type:'image/png'}}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}
