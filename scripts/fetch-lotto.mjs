// 로또 회차 결과 수집 → data/lotto-results.json 누적.
// GitHub Actions가 매주 토요일 추첨 후 실행 (수동 실행도 가능: workflow_dispatch).
// 소스: smok95/lotto 커뮤니티 미러 (GitHub Pages) — 동행복권 공식 API는
// 봇 차단(302 리다이렉트)이라 직접 수집 불가. 미러가 죽으면 이 파일의 소스만 교체.
// 앱은 우리 repo의 raw.githubusercontent JSON만 읽으므로 런타임 의존성 없음.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const FILE = 'data/lotto-results.json';
const BACKFILL = 60; // 첫 실행 시 최근 N회차 백필 (금고 보관 한도보다 넉넉하게)
const ROUND1_UTC = Date.UTC(2002, 11, 7); // 1회 추첨일 2002-12-07(토)

// 결과가 존재할 수 있는 최신 회차 — 마지막으로 지난 토요일 기준.
// 오늘이 토요일이면 21시(KST, 추첨 20:35 + 여유) 전에는 직전 회차까지만.
function latestDrawnRound() {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  const todayUtc = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
  const days = Math.floor((todayUtc - ROUND1_UTC) / 86400000);
  let round = Math.floor(days / 7) + 1;
  if (kst.getUTCDay() === 6 && kst.getUTCHours() < 21) round -= 1;
  return round;
}

async function fetchRound(no) {
  const url = `https://smok95.github.io/lotto/results/${no}.json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (lotto-results-bot)' } });
  if (!res.ok) return null;
  const j = await res.json().catch(() => null);
  if (!j || !Array.isArray(j.numbers) || j.numbers.length !== 6) return null;
  return {
    r: j.draw_no ?? no,
    d: String(j.date ?? '').slice(0, 10), // "2026-07-04T00:00:00Z" → "2026-07-04"
    n: j.numbers,
    b: j.bonus_no ?? 0,
  };
}

const doc = existsSync(FILE)
  ? JSON.parse(readFileSync(FILE, 'utf8'))
  : { rounds: [] };

const target = latestDrawnRound();
const have = new Set(doc.rounds.map((x) => x.r));
const from = doc.rounds.length
  ? Math.max(...doc.rounds.map((x) => x.r)) + 1
  : Math.max(1, target - BACKFILL + 1);

let added = 0;
for (let no = from; no <= target; no++) {
  if (have.has(no)) continue;
  const row = await fetchRound(no);
  if (!row) { console.warn(`round ${no}: 결과 없음/실패 — 중단`); break; }
  doc.rounds.push(row);
  added++;
  console.log(`round ${no}: ${row.n.join(',')} + ${row.b}`);
}

if (added > 0) {
  doc.rounds.sort((a, b) => a.r - b.r);
  mkdirSync('data', { recursive: true });
  writeFileSync(FILE, JSON.stringify(doc), 'utf8');
}
console.log(`완료 — 신규 ${added}회차, 총 ${doc.rounds.length}회차 (최신 목표 ${target}회)`);
