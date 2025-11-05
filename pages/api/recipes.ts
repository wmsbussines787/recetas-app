import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

function getDb(res: NextApiResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Supabase environment variables are not configured.');
    res.status(500).json({ error: 'Configuración de Supabase faltante' });
    return null;
  }

  return createClient(url, key);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const db = getDb(res);
    if (!db) return;

    const b = req.body as { slug?: string; title?: string } | null;
    if (!b?.slug || !b?.title) return res.status(400).json({ error: 'slug y title son requeridos' });
    const { data, error } = await db.from('recipes').insert([b]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  }
  if (req.method === 'DELETE') {
    const db = getDb(res);
    if (!db) return;

    const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
    const slug = typeof rawSlug === 'string' ? rawSlug.trim() : undefined;

    if (!slug) {
      return res.status(400).json({ error: 'slug es requerido' });
    }

    const { error, count } = await db
      .from('recipes')
      .delete({ count: 'exact' })
      .eq('slug', slug);

    if (error) return res.status(400).json({ error: error.message });
    if (!count) return res.status(404).json({ error: 'Receta no encontrada' });

    return res.status(204).end(null);
  }
  if (req.method === 'GET') {
    const db = getDb(res);
    if (!db) return;

    const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
    const slug = typeof rawSlug === 'string' ? rawSlug.trim() : undefined;

    res.setHeader('Cache-Control', 'max-age=0, s-maxage=60, stale-while-revalidate');

    if (slug) {
      const { data, error } = await db
        .from('recipes')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Receta no encontrada' });
      return res.status(200).json(data);
    }

    const { data, error } = await db.from('recipes').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }
  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end('Method Not Allowed');
}
