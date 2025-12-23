import { requireAdmin } from "../lib/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req)) return res.status(403).json({ error: "Forbidden" });

  const { priceUsd } = req.body || {};
  const n = Number(priceUsd);

  if (!Number.isFinite(n) || n <= 0 || n > 9999) {
    return res.status(400).json({ error: "Invalid priceUsd" });
  }

  try {
    const sb = supabaseAdmin();
    const { error } = await sb
      .from("settings")
      .upsert({ key: "price_usd", value: n, updated_at: new Date().toISOString() });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, priceUsd: n });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
