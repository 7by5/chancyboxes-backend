import { supabaseAdmin } from "../lib/supabase.js";
import { stripeClient } from "../lib/stripe.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { boxes } = req.body || {};
    if (!Array.isArray(boxes) || boxes.length < 1) {
      return res.status(400).json({ error: "boxes must be a non-empty array" });
    }

    const clean = [...new Set(boxes.map(String))].filter(
      (b) => b.length === 1 && b >= "A" && b <= "Z"
    );
    if (clean.length < 1) return res.status(400).json({ error: "No valid boxes" });

    const sb = supabaseAdmin();

    // قیمت از دیتابیس
    const { data: setting, error: se } = await sb
      .from("settings")
      .select("value")
      .eq("key", "price_usd")
      .single();
    if (se) return res.status(500).json({ error: se.message });

    const priceUsd = Number(setting.value);
    const amount = Math.round(priceUsd * 100) * clean.length;

    // جلوگیری از خرید باکس‌های sold
    const { data: current, error: be } = await sb
      .from("boxes")
      .select("id,status")
      .in("id", clean);
    if (be) return res.status(500).json({ error: be.message });

    const sold = current.filter((x) => x.status === "sold").map((x) => x.id);
    if (sold.length) return res.status(409).json({ error: `Already sold: ${sold.join(", ")}` });

    const stripe = stripeClient();
    const pi = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        boxes: clean.join(","),
        price_each_usd: String(priceUsd),
      },
    });

    return res.status(200).json({ clientSecret: pi.client_secret, priceUsd });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
