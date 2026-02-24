import { players } from "../_lib/players";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function pickDailyIndex(dateStr: string, secret: string, n: number): Promise<number> {
  const input = new TextEncoder().encode(`${dateStr}|${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  const bytes = new Uint8Array(digest);
  const x = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  const u = x >>> 0;
  return u % n;
}

function randomIndex(n: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % n;
}

export async function onRequestGet(context: {
  request: Request;
  env: { GAME_SECRET?: string };
}) {
  const secret = context.env.GAME_SECRET || "dev";
  if (players.length === 0) return json({ error: "No players loaded" }, 500);

  const url = new URL(context.request.url);
  const mode = url.searchParams.get("mode") || "unlimited";

  let idx = 0;

  if (mode === "daily") {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    idx = await pickDailyIndex(dateStr, secret, players.length);
  } else {
    idx = randomIndex(players.length);
  }

  const p = players[idx];

  return json({
    id: p.id,
    name: p.name,
    image: p.photo,
    career: p.clubs,
  });
}