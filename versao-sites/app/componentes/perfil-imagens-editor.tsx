'use client';
import type {EdicaoPerfil} from '@/lib/social';
import {visualDoPerfil} from '@/lib/personalizacao-perfil';
import ImagemComunidade from './imagem-comunidade';
import {AvatarComunidade} from './cartao-perfil';

type Props={edicao:EdicaoPerfil;ocupado:boolean;envios:{avatar:boolean;banner:boolean};aoOcupar:(tipo:'avatar'|'banner',ativo:boolean)=>void;aoMudar:(mudanca:Partial<EdicaoPerfil>)=>void};
export default function PerfilImagensEditor({edicao,ocupado,envios,aoOcupar,aoMudar}:Props){
 return <fieldset className="perfil-editor-grupo perfil-imagens-editor"><legend>Foto e capa própria</legend><div className="perfil-editor-imagens-grade">
  <div><h3>Foto de perfil</h3><AvatarComunidade nome={edicao.nome} avatar={edicao.avatar}/><ImagemComunidade finalidade="avatar" onOcupado={ativo=>aoOcupar('avatar',ativo)} disabled={ocupado} onEnviada={avatar=>aoMudar({avatar})}/>{edicao.avatar&&<button type="button" disabled={ocupado||envios.avatar} onClick={()=>aoMudar({avatar:''})}>Remover foto</button>}<p className="social-ajuda">Sua foto e seu nome ficam visíveis na comunidade.</p></div>
  <div><h3>Banner do perfil</h3>{edicao.banner?<img className="perfil-banner" src={edicao.banner} alt="Prévia da sua capa enviada"/>:<div className="perfil-editor-capa-vazia">Sua imagem aparece atrás da foto na vitrine.</div>}<ImagemComunidade finalidade="banner" onOcupado={ativo=>aoOcupar('banner',ativo)} disabled={ocupado} onEnviada={banner=>aoMudar({banner,visual:{...visualDoPerfil(edicao),capa:'pessoal'}})}/>{edicao.banner&&<button type="button" disabled={ocupado||envios.banner} onClick={()=>aoMudar({banner:'',visual:{...visualDoPerfil(edicao),capa:'origem'}})}>Remover banner</button>}<p className="social-ajuda">Sua imagem fica guardada ao experimentar as capas de recompensa.</p></div>
 </div></fieldset>;
}
