'use client';
export async function apiSala<T>(acao:string,dados?:Record<string,unknown>,signal?:AbortSignal):Promise<T> {
 const url=dados?'/api/yokira':`/api/yokira?${new URLSearchParams({acao})}`;
 const resposta=await fetch(url,dados?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({acao,...dados}),signal}:{signal});
 const valor=await resposta.json() as T & {erro?:string};
 if(!resposta.ok)throw new Error(valor.erro||'Não foi possível carregar a sala.');
 return valor as T;
}
export async function lerSala<T>(salaId:string,signal?:AbortSignal):Promise<T> {
 const resposta=await fetch(`/api/yokira?${new URLSearchParams({acao:'sala',salaId})}`,{signal,cache:'no-store'});
 const valor=await resposta.json() as T & {erro?:string};
 if(!resposta.ok)throw new Error(valor.erro||'Sala indisponível.');
 return valor as T;
}
