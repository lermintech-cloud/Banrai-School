// ดึงโพสต์จากเพจเฟซบุ๊กด้วย Graph API แล้วเขียนลง data/posts.json
// ใช้กับ GitHub Actions: โทเคนอ่านจาก Secret ชื่อ FB_PAGE_TOKEN (ห้ามเขียนลงไฟล์)
import { writeFile } from 'node:fs/promises';

const TOKEN = process.env.FB_PAGE_TOKEN;
const PAGE = process.env.FB_PAGE_ID || 'me';           // ใช้ 'me' ได้เมื่อเป็น Page Access Token
const VER = process.env.GRAPH_VERSION || 'v23.0';
const LIMIT = Number(process.env.POST_LIMIT || 30);

if (!TOKEN) { console.error('ไม่พบ FB_PAGE_TOKEN — ข้ามการอัปเดต'); process.exit(0); }

const api = async (path, params = {}) => {
  const u = new URL(`https://graph.facebook.com/${VER}/${path}`);
  Object.entries({ ...params, access_token: TOKEN }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
};

try {
  const page = await api(PAGE, { fields: 'name,link' });
  const fields = [
    'id', 'message', 'created_time', 'permalink_url', 'full_picture',
    'attachments{subattachments{media{image{src}}},media{image{src}}}',
    'reactions.summary(true).limit(0)', 'comments.summary(true).limit(0)'
  ].join(',');
  const feed = await api(`${PAGE === 'me' ? page.id : PAGE}/posts`, { fields, limit: LIMIT });

  const posts = feed.data.map(p => {
    const att = p.attachments?.data?.[0];
    const subs = att?.subattachments?.data?.map(s => s.media?.image?.src).filter(Boolean) || [];
    const images = subs.length ? subs : [p.full_picture || att?.media?.image?.src].filter(Boolean);
    return {
      id: p.id, created: p.created_time, message: p.message || '', images: images.slice(0, 10),
      reactions: p.reactions?.summary?.total_count || 0, comments: p.comments?.summary?.total_count || 0,
      url: p.permalink_url || ''
    };
  }).filter(p => p.message || p.images.length);

  await writeFile('data/posts.json', JSON.stringify({
    updated: new Date().toISOString(), page: { name: page.name, pageUrl: page.link || '' }, posts
  }, null, 2));
  console.log(`อัปเดตสำเร็จ ${posts.length} โพสต์จากเพจ "${page.name}"`);
} catch (e) {
  console.error('ดึงข้อมูลไม่สำเร็จ (คงข้อมูลเดิมไว้):', e.message);
  process.exit(0);
}
