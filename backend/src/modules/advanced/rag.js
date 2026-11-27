/**
 * Retrieval for the AI Question & Answer feature (RAG).
 *
 *   notes -> chunks -> embeddings (cached) -> cosine similarity  (+ small keyword boost)
 *         -> top notes -> prompt context for the LLM
 *
 * If the embeddings API fails, retrieval falls back to keyword (TF-IDF style) scoring so the
 * feature keeps working.
 */
const crypto = require('crypto');
const llm = require('./llm');

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;
const MAX_CHUNKS_PER_NOTE = 6;
const MAX_TOTAL_CHUNKS = 800;
const EMBED_BATCH = 50;
const TOP_NOTES = 5;
const MAX_CHUNKS_PER_RESULT_NOTE = 2;

const cache = new Map(); // sha1(model + text) -> number[]
const CACHE_LIMIT = 6000;

/** Strip HTML tags/entities in case the editor stores rich text. */
function plainText(input) {
  return String(input || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkText(text) {
  const clean = text.trim();
  if (!clean) return [];
  const out = [];
  let i = 0;
  while (i < clean.length && out.length < MAX_CHUNKS_PER_NOTE) {
    let end = Math.min(clean.length, i + CHUNK_SIZE);
    if (end < clean.length) {
      const cut = Math.max(clean.lastIndexOf('\n', end), clean.lastIndexOf(' ', end));
      if (cut > i + CHUNK_SIZE * 0.6) end = cut;
    }
    const piece = clean.slice(i, end).trim();
    if (piece) out.push(piece);
    if (end >= clean.length) break;
    i = end - CHUNK_OVERLAP;
  }
  return out;
}

const fold = (s) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
const tokenize = (s) => (fold(s).match(/[\p{L}\p{N}]+/gu) || []).filter((t) => t.length > 1);

function keywordScores(question, chunks) {
  const qTokens = [...new Set(tokenize(question))];
  if (qTokens.length === 0) return chunks.map(() => 0);
  const docs = chunks.map((c) => new Set(tokenize(`${c.title} ${c.text}`)));
  const n = docs.length;
  const idf = qTokens.map((t) => Math.log(1 + n / (1 + docs.filter((d) => d.has(t)).length)));
  const total = idf.reduce((a, b) => a + b, 0) || 1;
  return docs.map((d) => qTokens.reduce((sum, t, i) => sum + (d.has(t) ? idf[i] : 0), 0) / total);
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

async function embedAll(texts) {
  const model = process.env.EMBEDDING_MODEL || 'gemini-embedding-001';
  const keyOf = (t) => crypto.createHash('sha1').update(`${model}\n${t}`).digest('hex');
  const missing = [...new Set(texts.filter((t) => !cache.has(keyOf(t))))];
  for (let i = 0; i < missing.length; i += EMBED_BATCH) {
    const batch = missing.slice(i, i + EMBED_BATCH);
    const vectors = await llm.embed(batch);
    batch.forEach((t, j) => {
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
      cache.set(keyOf(t), vectors[j]);
    });
  }
  return texts.map((t) => cache.get(keyOf(t)));
}

/**
 * @param {string} question
 * @param {{id:number,title:string,content:string,source:'own'|'shared',updated_at:any}[]} notes
 * @returns {{mode:'semantic'|'keyword', notes: {id,title,source,updated_at,chunks:string[],score:number}[]}}
 */
async function retrieve(question, notes) {
  const chunks = [];
  for (const note of notes) {
    const body = plainText(note.content);
    const pieces = chunkText(body);
    if (pieces.length === 0 && note.title) pieces.push(''); // title-only note
    for (const text of pieces) {
      if (chunks.length >= MAX_TOTAL_CHUNKS) break;
      chunks.push({ note, title: note.title || '', text });
    }
  }
  if (chunks.length === 0) return { mode: 'keyword', notes: [] };

  const kw = keywordScores(question, chunks);
  let scores;
  let mode = 'semantic';
  try {
    const vectors = await embedAll(chunks.map((c) => `${c.title}\n${c.text}`.trim()));
    const [qVec] = await embedAll([question]);
    scores = chunks.map((_, i) => 0.8 * cosine(qVec, vectors[i]) + 0.2 * kw[i]);
  } catch (err) {
    console.error('[ai] embeddings unavailable, using keyword search:', err.message);
    mode = 'keyword';
    scores = kw;
  }

  const ranked = chunks.map((c, i) => ({ c, score: scores[i] })).sort((a, b) => b.score - a.score);
  const picked = new Map(); // noteId -> {note, chunks, score}
  for (const { c, score } of ranked) {
    if (mode === 'keyword' && score <= 0) break;
    let entry = picked.get(c.note.id);
    if (!entry) {
      if (picked.size >= TOP_NOTES) continue;
      entry = { note: c.note, chunks: [], score };
      picked.set(c.note.id, entry);
    }
    if (entry.chunks.length < MAX_CHUNKS_PER_RESULT_NOTE) entry.chunks.push(c.text);
  }
  return {
    mode,
    notes: [...picked.values()].map((e) => ({
      id: e.note.id,
      title: e.note.title,
      source: e.note.source,
      updated_at: e.note.updated_at,
      chunks: e.chunks,
      score: e.score,
    })),
  };
}

module.exports = { retrieve, plainText, chunkText };
