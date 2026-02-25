//This script was made entirely by AI

import fs from "node:fs/promises";

const API_KEY = process.env.THESPORTSDB_KEY || "123"; // use sua key; 123 é a free key
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// Free tier: 30 req/min => ~2.1s por request é seguro. :contentReference[oaicite:5]{index=5}
const REQUEST_DELAY_MS = 2100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} em ${url}\n${text}`);
  }
  return res.json();
}

function slugifyId(name, fallback) {
  const base = (name || fallback || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `player-${fallback}`;
}

function parseDate(s) {
  // s geralmente vem como "1991-02-05" etc.
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function calcAge(dateBorn) {
  const d = parseDate(dateBorn);
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function pickBestPhoto(p) {
  // Campos comuns: strCutout, strThumb, strRender, strFanart1...
  return p?.strCutout || p?.strThumb || p?.strRender || p?.strFanart1 || "";
}

async function searchPlayersByName(name) {
  // searchplayers.php?p=... :contentReference[oaicite:6]{index=6}
  const url = `${BASE}/searchplayers.php?p=${encodeURIComponent(name)}`;
  return fetchJson(url);
}

async function lookupPlayer(idPlayer) {
  // lookupplayer.php?id=... :contentReference[oaicite:7]{index=7}
  const url = `${BASE}/lookupplayer.php?id=${encodeURIComponent(idPlayer)}`;
  return fetchJson(url);
}

async function lookupFormerTeams(idPlayer) {
  // lookupformerteams.php?id=... :contentReference[oaicite:8]{index=8}
  const url = `${BASE}/lookupformerteams.php?id=${encodeURIComponent(idPlayer)}`;
  return fetchJson(url);
}

function normalizeFormerTeams(json) {
  const arr = json?.formerteams ?? [];
  return arr
    .map((t) => ({
      name: t.strFormerTeam || t.strTeam || "",
      crest: t.strTeamBadge || "",
      joined: t.strJoined || null,
      departed: t.strDeparted || null,
    }))
    .filter((c) => c.name);
}

function bestCandidate(candidates, seed) {
  // Heurística simples:
  // 1) strSport === "Soccer"
  // 2) se preferredNationality bater, prioriza
  // 3) match exato no nome (case-insensitive) prioriza
  // 4) senão, pega o primeiro “mais plausível”
  const name = (seed.name || "").toLowerCase().trim();
  const prefNat = (seed.preferredNationality || "").toLowerCase().trim();

  const soccer = (candidates || []).filter((c) => (c.strSport || "").toLowerCase() === "soccer");
  if (soccer.length === 0) return null;

  const exactName = soccer.filter((c) => (c.strPlayer || "").toLowerCase().trim() === name);
  const pool1 = exactName.length ? exactName : soccer;

  if (prefNat) {
    const natMatch = pool1.filter(
      (c) => (c.strNationality || "").toLowerCase().trim() === prefNat
    );
    if (natMatch.length) return natMatch[0];
  }

  return pool1[0];
}

async function main() {
  const seedPath = "data/seedPlayers.json";
  const seedRaw = JSON.parse(await fs.readFile(seedPath, "utf-8"));

  const resolved = [];
  const unresolved = [];

  // cache local pra evitar refazer lookup dentro da mesma execução
  const playerCache = new Map(); // idPlayer -> playerDetails

  for (const item of seedRaw) {
    try {
      let idPlayer = item.idPlayer || null;
      let chosen = null;

      if (!idPlayer) {
        await sleep(REQUEST_DELAY_MS);
        const search = await searchPlayersByName(item.name);
        const candidates = search?.player ?? [];

        chosen = bestCandidate(candidates, item);
        if (!chosen?.idPlayer) {
          unresolved.push({ seed: item, reason: "Nenhum candidato encontrado (ou não Soccer)." });
          continue;
        }
        idPlayer = chosen.idPlayer;
      }

      // lookup player (detalhes) :contentReference[oaicite:9]{index=9}
      let player = playerCache.get(idPlayer);
      if (!player) {
        await sleep(REQUEST_DELAY_MS);
        const lookup = await lookupPlayer(idPlayer);
        player = (lookup?.players ?? lookup?.player ?? [])[0] || null;
        if (!player) {
          unresolved.push({ seed: item, idPlayer, reason: "lookupplayer vazio" });
          continue;
        }
        playerCache.set(idPlayer, player);
      }

      // former teams (carreira) :contentReference[oaicite:10]{index=10}
      await sleep(REQUEST_DELAY_MS);
      const formerJson = await lookupFormerTeams(idPlayer);
      const clubs = normalizeFormerTeams(formerJson);

      // Você pode optar por incluir o time atual no topo:
      // (às vezes o endpoint de former teams não inclui o time atual)
      const currentTeam = player.strTeam || null;
      const currentTeamBadge = player.strTeamBadge || null; // pode não existir em todos os payloads
      if (currentTeam) {
        clubs.unshift({ name: currentTeam, crest: currentTeamBadge || "", joined: null, departed: null });
      }

      const out = {
        id: slugifyId(player.strPlayer || item.name, idPlayer),
        name: player.strPlayer || item.name,
        photo: pickBestPhoto(player),

        // “Cruciais” pra filtros e modos futuros
        sportdbPlayerId: idPlayer,
        nationality: player.strNationality || null,
        position: player.strPosition || null,
        birthDate: player.dateBorn || null,
        age: calcAge(player.dateBorn),

        // extras úteis
        height: player.strHeight || null,
        weight: player.strWeight || null,
        currentTeam: player.strTeam || null,
        currentTeamId: player.idTeam || null,

        // carreira pro seu modo atual
        clubs,

        // placeholders pra você popular depois (se decidir outra fonte/estratégia)
        stats: {
          matches: null,
          goals: null,
          assists: null,
        },
      };

      resolved.push(out);
      console.log(`+ ${out.name} (${out.nationality || "?"}) - clubes: ${out.clubs.length}`);
    } catch (e) {
      unresolved.push({ seed: item, reason: e?.message || String(e) });
    }
  }

  // filtros opcionais (recomendado pro seu jogo):
  // manter só quem tem pelo menos 3 clubes (incluindo atual)
  const filtered = resolved.filter((p) => (p.clubs?.length || 0) >= 3);

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile("data/players.json", JSON.stringify(filtered, null, 2), "utf-8");
  await fs.writeFile("data/unresolvedPlayers.json", JSON.stringify(unresolved, null, 2), "utf-8");

  console.log(`\n✅ data/players.json: ${filtered.length} jogadores`);
  console.log(`⚠️ data/unresolvedPlayers.json: ${unresolved.length} entradas para revisar`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});