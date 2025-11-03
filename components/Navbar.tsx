import Link from "next/link";

export default function Navbar(){
  return (
    <nav className="navbar">
      <Link className="navbtn" href="/">🏠 Inicio</Link>
      <Link className="navbtn" href="/recetas">🥘 Recetas</Link>
      <Link className="navbtn" href="/new">➕ Nueva</Link>
    </nav>
  );
}
