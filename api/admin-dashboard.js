import { requireAdmin } from "../lib/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: "Forbidden" });

  try {
    const sb = supabaseAdmin();

    const [{ data: s, error: se }, { data: b, error: be }] = await Promise.all([
      sb.from("settings").select("value").eq("key", "price_usd").single(),
      sb.from("boxes")
        .select("id,status,hold_expires_at,sold_at,payment_intent_id")
        .order("id", { ascending: true }),
    ]);

    if (se) return res.status(500).json({ error: se.message });
    if (be) return res.status(500).json({ error: be.message });

    const soldCount = b.filter((x) => x.status === "sold").length;

    return res.status(200).json({
      priceUsd: Number(s.value),
      soldCount,
      boxes: b,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
