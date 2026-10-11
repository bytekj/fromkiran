import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essays' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    // One of the slugs from TOPICS in src/config.ts
    topic: z.string(),
    // Set to true to keep an essay hidden while you are still writing it
    draft: z.boolean().default(false),
  }),
});

export const collections = { essays };
