import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Navbar from '../components/Navbar';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="app-shell">
      <div className="container">
        <Component {...pageProps} />
      </div>
      <Navbar />
    </div>
  );
}
