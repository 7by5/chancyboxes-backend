import { supabaseAdmin } from "../lib/supabase.js";

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("settings")
      .select("value")
      .eq("key", "price_usd")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ priceUsd: Number(data.value) });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
