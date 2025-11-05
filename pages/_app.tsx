import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import Navbar from '../components/Navbar';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Recetas App</title>
        <meta
          name="description"
          content="Explora, crea y administra tus recetas favoritas en la Recetas App."
        />
      </Head>
      <div className="app-shell">
        <div className="container">
          <Component {...pageProps} />
        </div>
        <Navbar />
      </div>
    </>
  );
}
