// Telas de carregamento e erro reaproveitadas em todas as páginas
export function Carregando({ texto = 'Carregando…' }) {
  return <div className="vazio" role="status">{texto}</div>;
}
export function Erro({ mensagem }) {
  return <div className="vazio" role="alert">{mensagem} Verifique se a API está rodando (npm run dev).</div>;
}
