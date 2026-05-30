import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    cover: z.string(),
    date: z.string(),
    data: z.string(),
    type: z.string(),
    por: z.string(),
    socials: z.string(),
    materia: z.string(),
    brand: z.string(),
    insta: z.string(),
  }),
});

export const collections = {
  blog,
};
