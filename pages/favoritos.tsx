import useSWR from "swr";
import Link from "next/link";
import { useFavorites } from "../lib/useFavorites";

type Recipe = { id?: string|number; slug: string; title: string; image_url?: string; tags?: string[] };

const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function FavoritosPage(){
  const { favs } = useFavorites();
  const { data, isLoading, error } = useSWR<Recipe[]>("/api/recipes", fetcher);
  const list = (data||[]).filter(r => favs.includes(r.slug));

  return (
    <>
      <h1 className="h1">⭐ Favoritos</h1>
      <p className="sub">Tus recetas guardadas en este dispositivo.</p>

      {isLoading && <p>Cargando…</p>}
      {error && <p style={{color:"#ff6b6b"}}>Error cargando recetas.</p>}
      {!isLoading && list.length===0 && <p>No tienes favoritos aún. Ve a <Link href="/recetas">/recetas</Link> y toca la ⭐.</p>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:18}}>
        {list.map(r=>(
          <Link key={r.slug} href={`/r/${encodeURIComponent(r.slug)}`} style={{border:"1px solid var(--border)",borderRadius:14,overflow:"hidden",background:"var(--card)",textDecoration:"none",color:"inherit"}}>
            <img src={r.image_url || `https://picsum.photos/seed/${encodeURIComponent(r.slug)}/400/300`} alt={r.title} style={{width:"100%",height:180,objectFit:"cover"}}/>
            <div style={{padding:14,fontWeight:700}}>{r.title}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
