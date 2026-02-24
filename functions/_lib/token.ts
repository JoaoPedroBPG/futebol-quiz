export type GameMode = "daily" | "unlimited";

export type GameState = {
  v: 1;
  mode: GameMode;
  playerId: string;
  revealed: number;
  attempts: number;
  maxAttempts: number;
  date?: string; // YYYY-MM-DD
  exp: number;   // unix epoch seconds
};

function toB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * Retorna Uint8Array com buffer ArrayBuffer (evita ArrayBufferLike/SharedArrayBuffer no tipo)
 */
function fromB64Url(b64url: string): Uint8Array {
  const b64 =
    b64url.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((b64url.length + 3) % 4);

  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function asArrayBuffer(view: Uint8Array): ArrayBuffer {
  // recorta exatamente o range usado (importante quando byteOffset != 0)
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

async function importHmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage
  );
}

async function hmacSha256(secret: string, data: Uint8Array): Promise<Uint8Array> {
  const key = await importHmacKey(secret, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, asArrayBuffer(data));
  return new Uint8Array(sig);
}

export async function signState(state: GameState, secret: string): Promise<string> {
  const payload = new TextEncoder().encode(JSON.stringify(state));
  const sig = await hmacSha256(secret, payload);
  return `${toB64Url(payload)}.${toB64Url(sig)}`;
}

export async function verifyState(token: string, secret: string): Promise<GameState | null> {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const payloadBytes = fromB64Url(payloadB64);
  const sigBytes = fromB64Url(sigB64);

  const key = await importHmacKey(secret, ["verify"]);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    asArrayBuffer(sigBytes),
    asArrayBuffer(payloadBytes)
  );
  if (!ok) return null;

  const state = JSON.parse(new TextDecoder().decode(payloadBytes)) as GameState;

  const now = Math.floor(Date.now() / 1000);
  if (state.exp < now) return null;

  return state;
}