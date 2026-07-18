import { defineCollection, z } from 'astro:content';

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    titleHu: z.string(),
    description: z.string(),
    descriptionHu: z.string(),
    date: z.date(),
    badge: z.string(),
    badgeHu: z.string(),
  }),
});

export const collections = { news };
