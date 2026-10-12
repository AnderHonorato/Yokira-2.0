// Avatar com iniciais na cor da pessoa e anel na cor do tier
export default function Avatar({ usuario, tamanho = 36, anel = true, online = false }) {
  if (!usuario) return null;
  const iniciais = usuario.nome.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <span className="avatar" style={{ '--t': `${tamanho}px`, '--c': usuario.cor, '--anel': anel ? usuario.tier?.cor ?? 'transparent' : 'transparent' }} aria-hidden="true">
      {usuario.avatar ? <img src={usuario.avatar} alt="" /> : iniciais}
      {online && <i className="avatar-online" />}
    </span>
  );
}

export function SeloTier({ tier }) {
  if (!tier) return null;
  return <span className="selo-tier" style={{ '--c': tier.cor }}>{tier.nome}</span>;
}
