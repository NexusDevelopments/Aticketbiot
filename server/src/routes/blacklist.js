import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { sendBlacklistEmbed } from "../bot.js";

const router = express.Router();

const addSchema = z.object({
  userId: z.string().min(5),
  reason: z.string().min(2),
  duration: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
  createdBy: z.string().min(5)
});

router.get("/", async (req, res) => {
  const entries = await prisma.blacklistEntry.findMany({
    orderBy: { createdAt: "desc" }
  });
  return res.json(entries);
});

router.post("/", async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const entry = await prisma.blacklistEntry.create({
    data: {
      userId: parsed.data.userId,
      reason: parsed.data.reason,
      duration: parsed.data.duration,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      createdBy: parsed.data.createdBy
    }
  });

  await sendBlacklistEmbed({
    userId: entry.userId,
    reason: entry.reason,
    duration: entry.duration
  });

  return res.json(entry);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.blacklistEntry.delete({ where: { id } }).catch(() => null);
  return res.json({ ok: true });
});

export default router;
