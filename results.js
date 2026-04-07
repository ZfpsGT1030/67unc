import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    // body may be a string or already parsed depending on content-type
    let data = req.body;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }
    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Body must be a JSON object" });
    }

    // generate a 16-char random id
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    // store for 7 days
    await kv.set(`result:${id}`, data, { ex: 60 * 60 * 24 * 7 });

    const host =
      req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const url = `${proto}://${host}/result/${id}`;

    return res.status(200).json({ url, id });
  } catch (err) {
    console.error("[results] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
