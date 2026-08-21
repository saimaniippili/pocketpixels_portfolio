import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getAllGalleryImages, getGalleryImageById, createGalleryImage, updateGalleryImage, deleteGalleryImage } from "./db";
import { z } from "zod";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  gallery: router({
    list: publicProcedure.query(() => getAllGalleryImages()),
    getById: publicProcedure.input(z.number()).query(({ input }) => getGalleryImageById(input)),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          imageUrl: z.string(),
          imageKey: z.string(),
          category: z.string().default("landscapes"),
          displayOrder: z.number().default(0),
        })
      )
      .mutation(({ input, ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        return createGalleryImage(input);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          category: z.string().optional(),
          displayOrder: z.number().optional(),
          isPublished: z.number().optional(),
        })
      )
      .mutation(({ input, ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        const { id, ...data } = input;
        return updateGalleryImage(id, data);
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(({ input, ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        return deleteGalleryImage(input);
      }),
    uploadImage: protectedProcedure
      .input(
        z.object({
          file: z.instanceof(Uint8Array),
          filename: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        const { file, filename, mimeType } = input;
        const key = `gallery/${Date.now()}_${filename}`;
        const { url, key: hashedKey } = await storagePut(key, file, mimeType);
        return { url, key: hashedKey };
      }),
  }),
});

export type AppRouter = typeof appRouter;
