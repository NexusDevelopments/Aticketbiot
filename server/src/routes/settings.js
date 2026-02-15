import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = express.Router();

const settingsSchema = z.object({
  guildId: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  blacklistChannelId: z.string().optional(),
  ticketLogChannelId: z.string().optional(),
  panelChannelId: z.string().optional(),
  imageUrl: z.string().url().optional(),
  botToken: z.string().optional(),
  botClientId: z.string().optional()
});

router.get("/", async (req, res) => {
  const settings = await prisma.setting.findUnique({ where: { id: "singleton" } });
  if (!settings) return res.json(settings);

  if (req.user?.role !== "OWNER") {
    const { botToken, ...rest } = settings;
    return res.json({ ...rest, botToken: botToken ? "••••••" : "" });
  }

  return res.json(settings);
});

router.put("/", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  if (req.user?.role !== "OWNER") {
    if (parsed.data.botToken || parsed.data.botClientId) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const settings = await prisma.setting.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data }
  });

  return res.json(settings);
});

export default router;
