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
      [11, 21, 25],
      [27, 49, 57],
    ],
    border: { color: [232, 97, 58], width: 14, side: 'inline-start' },
    padding: 80,
    font: {
      title: { color: [249, 247, 244], size: 70, weight: 'Bold' },
      description: { color: [159, 173, 178], size: 32, lineHeight: 1.4 },
    },
  }),
});
