// 네이버 블로그 RSS를 읽어 site/js/rss-data.js 로 저장합니다.
// 가져오기에 실패하면 기존 파일을 그대로 두고 정상 종료합니다(배포는 계속 진행).
import { writeFile } from "node:fs/promises";

const FEED_URL = process.env.RSS_URL || "https://rss.blog.naver.com/spacewin.xml";
const OUT = new URL("../site/js/rss-data.js", import.meta.url);
const input = process.argv[2]; // 테스트용: 로컬 XML 파일 경로

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

function parse(xml) {
  const channel = xml.split(/<item[\s>]/)[0];
  const blog = {
    title: decode(tag(channel, "title")),
    description: decode(tag(channel, "description")),
    link: cleanLink(tag(channel, "link")),
    image: decode(tag(tag(channel, "image"), "url")),
  };
  const posts = (xml.match(/<item[\s>][\s\S]*?<\/item>/g) || []).map((item) => {
    const html = decode(tag(item, "description"));
    const img = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const date = new Date(tag(item, "pubDate"));
    return {
      title: decode(tag(item, "title")),
      url: cleanLink(tag(item, "link")),
      category: decode(tag(item, "category")),
      date: isNaN(date) ? "" : date.toISOString().slice(0, 10),
      image: img ? decode(img[1]) : "",
      summary: text.length > 120 ? text.slice(0, 120) + "…" : text,
    };
  });
  return { blog, posts };
}

async function load() {
  if (input) return (await import("node:fs/promises")).readFile(input, "utf8");
  const res = await fetch(FEED_URL, { headers: { "User-Agent": "Mozilla/5.0 (rss-import)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

try {
  const { blog, posts } = parse(await load());
  if (posts.length === 0) throw new Error("글이 하나도 없습니다");
  const body =
    "// 자동 생성 파일입니다 (scripts/import-rss.mjs). 직접 수정하지 마세요.\n" +
    `window.RSS_BLOG = ${JSON.stringify(blog, null, 2)};\n` +
    `window.RSS_POSTS = ${JSON.stringify(posts, null, 2)};\n`;
  await writeFile(OUT, body);
  console.log(`RSS 가져오기 완료: 글 ${posts.length}개, 이미지 있는 글 ${posts.filter((p) => p.image).length}개`);
} catch (err) {
  console.warn(`::warning::RSS 가져오기 실패 (${err.message}). 기존 데이터를 유지합니다.`);
}
