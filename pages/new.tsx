import { useState } from "react";

export default function NewRecipe() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg(null); setErr(null);

    const fd = new FormData(e.currentTarget);
    const slug = String(fd.get("slug") || "").trim();
    const title = String(fd.get("title") || "").trim();

    if (!slug || !title) {
      setErr("slug y title son requeridos");
      setLoading(false);
      return;
    }

    // Parseos simples
    const tags = String(fd.get("tags") || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const ingredients = String(fd.get("ingredients") || "")
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const steps = String(fd.get("steps") || "")
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const servings = Number(fd.get("servings") || "") || undefined;
    const time_total = Number(fd.get("time_total") || "") || undefined;

    const kcal = fd.get("kcal"); const carbs = fd.get("carbs");
    const protein = fd.get("protein"); const fat = fd.get("fat");
    const nutrition =
      kcal || carbs || protein || fat
        ? {
            ...(kcal ? { kcal: Number(kcal) || 0 } : {}),
            ...(carbs ? { carbs: Number(carbs) || 0 } : {}),
            ...(protein ? { protein: Number(protein) || 0 } : {}),
            ...(fat ? { fat: Number(fat) || 0 } : {}),
          }
        : undefined;

    const body = {
      slug,
      title,
      description: String(fd.get("description") || "") || undefined,
      video_url: String(fd.get("video_url") || "") || undefined,
      image_url: String(fd.get("image_url") || "") || undefined,
      tags: tags.length ? tags : undefined,
      servings,
      time_total,
      nutrition,
      ingredients: ingredients.length ? ingredients : undefined,
      steps: steps.length ? steps : undefined
    };

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creando receta");
      setMsg(`¡Receta creada! slug: ${data.slug || slug}`);
      (e.target as HTMLFormElement).reset();
    } catch (e:any) {
      setErr(e.message || "Error creando receta");
    } finally {
      setLoading(false);
    }
  }

  const S: React.CSSProperties = { maxWidth: 720, margin: "32px auto", fontFamily: "system-ui" };
  const L: React.CSSProperties = { display: "block", fontWeight: 600, marginTop: 12 };
  const I: React.CSSProperties = { width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 };
  const TA = I;

  return (
    <main style={S}>
      <h1>Crear Receta</h1>
      <p>Guarda directo en <code>/api/recipes</code>.</p>

      {msg && <div style={{background:"#e6ffed",border:"1px solid #b7eb8f",padding:12,borderRadius:8,margin:"12px 0"}}>{msg}</div>}
      {err && <div style={{background:"#fff2f0",border:"1px solid #ffccc7",padding:12,borderRadius:8,margin:"12px 0"}}>{err}</div>}

      <form onSubmit={onSubmit}>
        <label style={L}>Slug* (único)</label>
        <input name="slug" placeholder="ej. pollo-al-horno" style={I} required />

        <label style={L}>Título*</label>
        <input name="title" placeholder="ej. Pollo al horno" style={I} required />

        <label style={L}>Descripción</label>
        <textarea name="description" rows={3} placeholder="Resumen..." style={TA} />

        <label style={L}>Video URL</label>
        <input name="video_url" placeholder="https://..." style={I} />

        <label style={L}>Imagen URL</label>
        <input name="image_url" placeholder="https://..." style={I} />

        <label style={L}>Tags (separados por coma)</label>
        <input name="tags" placeholder="keto, airfryer" style={I} />

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={L}>Porciones</label>
            <input name="servings" type="number" min="1" style={I} />
          </div>
          <div>
            <label style={L}>Tiempo total (min)</label>
            <input name="time_total" type="number" min="0" style={I} />
          </div>
        </div>

        <fieldset style={{border:"1px solid #ddd",borderRadius:8,marginTop:16,padding:12}}>
          <legend style={{padding:"0 6px"}}>Nutrición (opcional)</legend>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            <div><label style={L}>kcal</label><input name="kcal" type="number" min="0" style={I} /></div>
            <div><label style={L}>carbs (g)</label><input name="carbs" type="number" min="0" style={I} /></div>
            <div><label style={L}>protein (g)</label><input name="protein" type="number" min="0" style={I} /></div>
            <div><label style={L}>fat (g)</label><input name="fat" type="number" min="0" style={I} /></div>
          </div>
        </fieldset>

        <label style={L}>Ingredientes (uno por línea)</label>
        <textarea name="ingredients" rows={5} placeholder={"1 pollo\n2 papas\nsal\npimienta"} style={TA} />

        <label style={L}>Pasos (uno por línea)</label>
        <textarea name="steps" rows={5} placeholder={"Precalentar horno a 180C\nSazonar\nHornear 45 min"} style={TA} />

        <button type="submit" disabled={loading} style={{marginTop:16,padding:"10px 16px",borderRadius:8,border:"none",background:"#111",color:"#fff"}}>
          {loading ? "Guardando..." : "Crear receta"}
        </button>
      </form>

      <p style={{marginTop:16}}>
        Ver lista en <a href="/api/recipes" target="_blank" rel="noreferrer">/api/recipes</a>
      </p>
    </main>
  );
}
