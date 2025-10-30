import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.slug || !b.title) return res.status(400).json({ error: 'slug y title son requeridos' });
    const { data, error } = await db.from('recipes').insert([b]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  }
  if (req.method === 'GET') {
    const { data, error } = await db.from('recipes').select('*').order('created_at',{ascending:false});
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }
  res.setHeader('Allow', ['GET','POST']);
  return res.status(405).end('Method Not Allowed');
}
