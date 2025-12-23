import { supabaseAdmin } from "../lib/supabase.js";

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("boxes")
      .select("id,status,hold_expires_at,sold_at")
      .order("id", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ boxes: data });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
