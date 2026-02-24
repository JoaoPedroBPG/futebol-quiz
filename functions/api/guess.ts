import { players, normalizeName } from "../_lib/players";
import { verifyState, signState, type GameState } from "../_lib/token";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost(context: {
  request: Request;
  env: { GAME_SECRET?: string };
}) {
  const secret = context.env.GAME_SECRET;
  if (!secret) return json({ error: "Missing env GAME_SECRET" }, 500);

  const body = await context.request.json().catch(() => null) as null | {
    token?: string;
    guess?: string;
  };
  if (!body?.token || !body?.guess) return json({ error: "token and guess required" }, 400);

  const state = await verifyState(body.token, secret);
  if (!state) return json({ error: "Invalid/expired token" }, 401);

  // trava token daily por data (evita reuso em outro dia)
  if (state.mode === "daily" && state.date) {
    const nowDate = new Date().toISOString().slice(0, 10);
    if (state.date !== nowDate) return json({ error: "Daily token is not valid for today" }, 401);
  }

  const player = players.find(p => p.id === state.playerId);
  if (!player) return json({ error: "Player not found" }, 404);

  if (state.attempts >= state.maxAttempts) {
    return json({
      done: true,
      correct: false,
      token: body.token,
      clubsRevealed: player.clubs.slice(0, state.revealed),
      attemptsLeft: 0,
      answer: player.name,
    });
  }

  const normalizedGuess = normalizeName(body.guess);
  const normalizedAnswer = normalizeName(player.name);

  const correct = normalizedGuess === normalizedAnswer;

  const next: GameState = {
    ...state,
    attempts: state.attempts + 1,
    // se errou, revela mais 1 clube (até o máximo)
    revealed: correct ? state.revealed : Math.min(state.revealed + 1, player.clubs.length),
    // estende exp um pouco a cada ação
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2,
  };

  const newToken = await signState(next, secret);

  const done = correct || next.attempts >= next.maxAttempts || next.revealed >= player.clubs.length;

  return json({
    done,
    correct,
    token: newToken,
    clubsRevealed: player.clubs.slice(0, next.revealed),
    attemptsLeft: next.maxAttempts - next.attempts,
    // se acabou, pode revelar resposta
    answer: done ? player.name : undefined,
  });
}