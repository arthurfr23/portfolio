import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { BASE } from '../config/site';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ id, data }) => id.startsWith('pt/') && !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: 'Arthur Reis · Blog',
    description: 'Engenharia de dados, Databricks e IA',
    site: context.site ?? 'https://arthurfr23.github.io',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `${BASE}/blog/${p.id.replace(/^pt\//, '')}/`,
    })),
  });
}
