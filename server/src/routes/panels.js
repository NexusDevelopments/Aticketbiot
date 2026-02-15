import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = express.Router();

const panelSchema = z.object({
  name: z.string().min(2),
  channelId: z.string().min(5),
  messageId: z.string().optional()
});

router.get("/", async (req, res) => {
  const panels = await prisma.ticketPanel.findMany({
    orderBy: { createdAt: "desc" }
  });
  return res.json(panels);
});

router.post("/", async (req, res) => {
  const parsed = panelSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const panel = await prisma.ticketPanel.create({ data: parsed.data });
  return res.json(panel);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.ticketPanel.delete({ where: { id } }).catch(() => null);
  return res.json({ ok: true });
});

export default router;
