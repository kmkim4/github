// 네이버 블로그 RSS를 읽어 site/js/rss-data.js 로 저장하고, 대표 이미지를 site/images/rss/ 에 내려받습니다.
// 가져오기에 실패하면 기존 파일을 그대로 두고 정상 종료합니다(배포는 계속 진행).
import { mkdir, readFile, writeFile } from "node:fs/promises";

const FEED_URL = process.env.RSS_URL || "https://rss.blog.naver.com/spacewin.xml";
const SITE_DIR = new URL("../site/", import.meta.url);
const OUT = new URL("js/rss-data.js", SITE_DIR);
const IMAGE_DIR = new URL("images/rss/", SITE_DIR);
const input = process.argv[2]; // 테스트용: 로컬 XML 파일 경로
const skipImages = Boolean(input) || process.env.SKIP_IMAGES === "1";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

function decode(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();
}

function cleanLink(url) {
  try {
    const u = new URL(decode(url));
    u.search = "";
    return u.toString();
  } catch {
    return decode(url);
  }
}

// "[56] 결혼·웨딩행사 ... | "인연을 맺는 날" 손글씨 붓글씨 제작" → { no: 56, title: "인연을 맺는 날" }
// "배경화면 무료 나눔｜너의 속도로 피어나" → "너의 속도로 피어나"
// "캘리그라피 작품_01 먹빛으로 담아낸 봄의 아쉬움" → "먹빛으로 담아낸 봄의 아쉬움"
// "[작업 의뢰 안내] ..." 처럼 번호가 아닌 머리말은 공지로 표시합니다.
function splitTitle(full) {
  const no = full.match(/^\s*\[(\d+)\]/);
  const notice = /^\s*\[[^\]\d][^\]]*\]/.test(full);
  const quoted = full.match(/["“”‘’']([^"“”‘’']{2,40})["“”‘’']/);
  let title;
  if (quoted) title = quoted[1];
  else if (/[｜|]/.test(full) && !notice) title = full.split(/[｜|]/).pop();
  else title = full.replace(/^\s*\[\d+\]\s*/, "").replace(/^캘리그라피 작품_\d+\s*/, "");
  return { no: no ? Number(no[1]) : null, notice, title: title.trim() };
}

const GENERIC_TAGS = new Set(["글씨상점", "캘리그라피", "손글씨", "붓글씨", "캘리그라피포트폴리오", "목업디자인", "캘리그라피디자인"]);

function summarize(text) {
  const cleaned = text
    .replace(/^안녕하세요\.?\s*/, "")
    .replace(/^글씨상점입니다\.?\s*/, "")
    .replace(/^오늘(의)? 작업은\s*|^오늘은\s*/, "");
  const first = cleaned.split(/(?<=[.!?。])\s/)[0];
  return first.length > 90 ? first.slice(0, 90) + "…" : first;
}

function parse(xml) {
  const channel = xml.split(/<item[\s>]/)[0];
  const blog = {
    title: decode(tag(channel, "title")),
    link: cleanLink(tag(channel, "link")),
  };
  const posts = (xml.match(/<item[\s>][\s\S]*?<\/item>/g) || []).map((item) => {
    const html = decode(tag(item, "description"));
    const img = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/\.{3,}\s*$/, "").trim();
    const date = new Date(tag(item, "pubDate"));
    const fullTitle = decode(tag(item, "title"));
    const url = cleanLink(tag(item, "link"));
    return {
      id: url.split("/").pop(),
      ...splitTitle(fullTitle),
      fullTitle,
      url,
      category: decode(tag(item, "category")),
      date: isNaN(date) ? "" : date.toISOString().slice(0, 10),
      tags: decode(tag(item, "tag")).split(",").map((t) => t.trim()).filter((t) => t && !GENERIC_TAGS.has(t)).slice(0, 3),
      summary: summarize(text),
      image: img ? decode(img[1]) : "",
    };
  });
  return { blog, posts };
}

// 썸네일(type=s3)은 작아서, 더 큰 크기를 먼저 시도하고 받아지는 것 중 가장 큰 파일을 씁니다.
function imageCandidates(src) {
  const u = new URL(src);
  const big = (host) => `https://${host}${u.pathname}?type=w966`;
  return [big("postfiles.pstatic.net"), big(u.host), src];
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Referer: "https://blog.naver.com/" } });
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.length > 2000 ? { buf, type } : null;
}

async function saveImage(post) {
  let best = null;
  for (const url of imageCandidates(post.image)) {
    const got = await download(url).catch(() => null);
    if (got && (!best || got.buf.length > best.buf.length)) best = got;
  }
  if (!best) return false;
  const ext = { "image/png": "png", "image/gif": "gif", "image/webp": "webp" }[best.type] || "jpg";
  const name = `${post.id}.${ext}`;
  await writeFile(new URL(name, IMAGE_DIR), best.buf);
  post.image = `images/rss/${name}`;
  return true;
}

async function saveImages(posts) {
  await mkdir(IMAGE_DIR, { recursive: true });
  const queue = posts.filter((p) => p.image);
  let saved = 0;
  const worker = async () => {
    for (let post = queue.shift(); post; post = queue.shift()) {
      if (await saveImage(post)) saved++;
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return saved;
}

async function load() {
  if (input) return readFile(input, "utf8");
  const res = await fetch(FEED_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

try {
  const { blog, posts } = parse(await load());
  if (posts.length === 0) throw new Error("글이 하나도 없습니다");
  const withImage = posts.filter((p) => p.image).length;
  const saved = skipImages ? 0 : await saveImages(posts);
  const body =
    "// 자동 생성 파일입니다 (scripts/import-rss.mjs). 직접 수정하지 마세요.\n" +
    `window.RSS_BLOG = ${JSON.stringify(blog, null, 2)};\n` +
    `window.RSS_POSTS = ${JSON.stringify(posts, null, 2)};\n`;
  await writeFile(OUT, body);
  console.log(`RSS 가져오기 완료: 글 ${posts.length}개, 이미지 있는 글 ${withImage}개, 내려받은 이미지 ${saved}개`);
} catch (err) {
  console.warn(`::warning::RSS 가져오기 실패 (${err.message}). 기존 데이터를 유지합니다.`);
}
