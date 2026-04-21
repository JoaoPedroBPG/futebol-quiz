import fs from "node:fs/promises";

const SEED_PATH = "data/seedPlayers.json";
const OUT_PATH = "data/players.json";
const UNRESOLVED_PATH = "data/unresolvedPlayers.json";

const PTWIKI = "https://pt.wikipedia.org/w/api.php";
const ENWIKI = "https://en.wikipedia.org/w/api.php";

// delays leves pra não estressar API
const DELAY_MS = 300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "GuessTheCareerBot/1.0 (local script)",
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

function slugifyId(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// pega wikitext bruto do artigo
async function getWikitext(langApi, title) {
  const url =
    `${langApi}?action=parse&format=json&prop=wikitext&page=${encodeURIComponent(title)}` +
    `&redirects=1&formatversion=2`;
  const json = await fetchJson(url);
  const wikitext = json?.parse?.wikitext;
  return typeof wikitext === "string" ? wikitext : null;
}

// extrai bloco do infobox (bem simples: {{Infobox ... }} até fechar)
function extractInfobox(wikitext) {
  if (!wikitext) return null;
  const start = wikitext.search(/\{\{\s*Infobox/i);
  if (start === -1) return null;

  // parsing por contagem de chaves
  let depth = 0;
  for (let i = start; i < wikitext.length - 1; i++) {
    const two = wikitext.slice(i, i + 2);
    if (two === "{{") depth++;
    if (two === "}}") depth--;
    if (depth === 0) {
      return wikitext.slice(start, i + 2);
    }
  }
  return null;
}

function cleanValue(v) {
  if (!v) return "";
  return v
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "") // remove refs
    .replace(/<ref[^\/]*\/>/gi, "")
    .replace(/\{\{[\s\S]*?\}\}/g, "") // remove templates simples
    .replace(/\[\[([^\|\]]+)\|([^\]]+)\]\]/g, "$2") // [[A|B]] -> B
    .replace(/\[\[([^\]]+)\]\]/g, "$1") // [[A]] -> A
    .replace(/'''+/g, "") // bold/italic
    .replace(/&nbsp;/g, " ")
    .trim();
}

// lê campos |clubs1=, |clubs2=... e |years1=...
function parseInfoboxCareer(infobox) {
  if (!infobox) return null;

  const clubs = new Map(); // index -> name
  const years = new Map(); // index -> "2009–2012"

  // captura linhas | key = value
  const lines = infobox.split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*\|\s*([a-zA-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    const val = cleanValue(m[2]);

    // ignora juventude/base explicitamente
    if (/^youthclubs\d+$/i.test(key) || /^youthyears\d+$/i.test(key)) continue;

    const c = key.match(/^clubs(\d+)$/i);
    if (c) clubs.set(Number(c[1]), val);

    const y = key.match(/^years(\d+)$/i);
    if (y) years.set(Number(y[1]), val);
  }

  if (clubs.size === 0) return [];

  // monta lista (profissional)
  const items = [];
  const indices = Array.from(clubs.keys()).sort((a, b) => a - b);
  for (const idx of indices) {
    const name = clubs.get(idx);
    if (!name) continue;
    const period = years.get(idx) || null;
    items.push({ name, period });
  }

  return items;
}

// converte "2009–2012" em joined/departed ISO aproximado
function periodToDates(period) {
  if (!period) return { joined: null, departed: null };

  const p = period.replace(/\s/g, "");
  // formatos comuns: "2009–2012", "2009-2012", "2012", "2012–"
  const m = p.match(/^(\d{4})(?:[–-](\d{4})?)?$/);
  if (!m) return { joined: null, departed: null };

  const y1 = m[1];
  const y2 = m[2];

  const joined = `${y1}-01-01T00:00:00Z`;
  const departed = y2 ? `${y2}-01-01T00:00:00Z` : null;
  return { joined, departed };
}

async function main() {
  const seed = JSON.parse(await fs.readFile(SEED_PATH, "utf-8"));
  const resolved = [];
  const unresolved = [];

  for (const s of seed) {
    const seedName = s.name?.trim();
    const pageTitle = (s.wikipedia || s.name || "").trim();
    if (!seedName || !pageTitle) {
      unresolved.push({ seed: s, reason: "seed missing name/wikipedia" });
      continue;
    }

    // tenta ptwiki, depois enwiki
    await sleep(DELAY_MS);
    let wikitext = await getWikitext(PTWIKI, pageTitle);
    let usedWiki = "pt";
    if (!wikitext) {
      await sleep(DELAY_MS);
      wikitext = await getWikitext(ENWIKI, pageTitle);
      usedWiki = "en";
    }

    if (!wikitext) {
      unresolved.push({ seed: s, reason: "could not fetch wikitext (pt/en)" });
      continue;
    }

    const infobox = extractInfobox(wikitext);
    const career = parseInfoboxCareer(infobox);

    if (!career || career.length === 0) {
      unresolved.push({ seed: s, reason: "could not parse clubs/years from infobox", wiki: usedWiki });
      continue;
    }

    // monta clubs já com datas e ordem “mais recente primeiro”
    const clubs = career
      .map((c) => {
        const { joined, departed } = periodToDates(c.period);
        return { name: c.name, crest: "", joined, departed };
      })
      .reverse(); // infobox costuma ser do mais antigo -> mais recente

    resolved.push({
      id: slugifyId(seedName),
      name: seedName,              // ✅ nome popular do seed
      source: { wikipedia: pageTitle, lang: usedWiki },
      photo: null,                 // você pode preencher depois (Wikidata ou Wikipedia pageimages)
      nationality: null,
      position: null,
      birthDate: null,
      age: null,
      height: null,
      stats: { matches: null, goals: null, assists: null },
      clubs,
    });

    console.log(`+ ${seedName} clubs=${clubs.length} (${usedWiki}wiki)`);
  }

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(resolved, null, 2), "utf-8");
  await fs.writeFile(UNRESOLVED_PATH, JSON.stringify(unresolved, null, 2), "utf-8");

  console.log(`\n✅ Wrote ${OUT_PATH} (${resolved.length})`);
  console.log(`⚠️ Wrote ${UNRESOLVED_PATH} (${unresolved.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});