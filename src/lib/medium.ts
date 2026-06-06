import { resilient, fetchWithTimeout, makeParser, asArray } from './rss';
import { channels } from '../data/channels';

export interface ArticleInfo {
  title: string;
  url: string;
  excerpt: string;
  image: string | null;
  published: string;
}

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const firstImage = (html: string): string | null => {
  const srcs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
  // ignora o pixel de tracking do Medium (medium.com/_/stat)
  const real = srcs.find((src) => !src.includes('/_/stat') && !src.includes('medium.com/_/'));
  return real ?? null;
};

async function fetchArticles(): Promise<ArticleInfo[]> {
  const user = channels.medium.username;
  if (!user || user.includes('PLACEHOLDER')) return [];

  const handle = user.startsWith('@') ? user : `@${user}`;
  const res = await fetchWithTimeout(`https://medium.com/feed/${handle}`);
  if (!res.ok) throw new Error(`Medium feed ${res.status}`);

  const data = makeParser().parse(await res.text());
  const items = asArray<Record<string, any>>(data?.rss?.channel?.item);

  return items.slice(0, 6).map((it) => {
    const content = String(it['content:encoded'] ?? it.description ?? '');
    const excerpt = stripHtml(content);
    return {
      title: String(it.title ?? ''),
      url: String(it.link ?? '').split('?')[0],
      excerpt: excerpt.length > 160 ? `${excerpt.slice(0, 160)}…` : excerpt,
      image: firstImage(content),
      published: String(it.pubDate ?? ''),
    };
  });
}

export const getArticles = (): Promise<ArticleInfo[]> => resilient('medium', [], fetchArticles);
