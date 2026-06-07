import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import { profile } from '../../data/profile';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const blogPages = Object.fromEntries(
  posts.map((p) => {
    const [lang, ...rest] = p.id.split('/');
    return [`blog-${lang}-${rest.join('/')}`, { title: p.data.title, description: p.data.description }];
  }),
);

const pages: Record<string, { title: string; description: string }> = {
  site: {
    title: profile.name,
    description: 'Engenheiro de Dados e IA · Microsoft Fabric · Databricks · Azure',
  },
  ...blogPages,
};

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [
      [7, 12, 24],
      [15, 23, 42],
    ],
    border: { color: [59, 130, 246], width: 14, side: 'inline-start' },
    padding: 80,
    font: {
      title: { color: [248, 250, 252], size: 70, weight: 'Bold' },
      description: { color: [148, 163, 184], size: 32, lineHeight: 1.4 },
    },
  }),
});
