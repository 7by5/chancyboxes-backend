import crypto from "crypto";

function hmac(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function issueAdminToken() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("Missing ADMIN_PASSWORD");

  const ts = Date.now().toString();
  const sig = hmac(ts, secret);
  return `${ts}.${sig}`;
}

export function requireAdmin(req) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;

  // انقضا: ۱۲ ساعت
  const ageMs = Date.now() - Number(ts);
  if (!Number.isFinite(ageMs) || ageMs > 12 * 60 * 60 * 1000) return false;

  const expected = hmac(ts, secret);

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
