export default function Home() {
  return (
    <main style={{maxWidth: 720, margin: '40px auto', fontFamily:'system-ui'}}>
      <h1>Recetas App</h1>
      <p>API lista en <code>/api/recipes</code>. Inserta una receta con POST y aparecerá en la BD.</p>
    </main>
  );
}
