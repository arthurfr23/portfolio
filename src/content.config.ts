import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Posts organizados por idioma: src/content/blog/<lang>/<slug>.md
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    canonical: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
