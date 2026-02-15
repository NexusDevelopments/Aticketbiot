import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { sendPanelMessage } from "../bot.js";

const router = express.Router();

const panelSchema = z.object({
  name: z.string().min(2),
  channelId: z.string().min(5),
  messageId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  componentType: z.enum(["BUTTON", "DROPDOWN", "TICKET"]).optional(),
  buttonLabels: z.array(z.string().min(1)).optional(),
  dropdownOptions: z.array(z.string().min(1)).optional()
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

router.post("/:id/send", async (req, res) => {
  const { id } = req.params;
  const panel = await prisma.ticketPanel.findUnique({ where: { id } });
  if (!panel) return res.status(404).json({ error: "Panel not found" });

  try {
    const messageId = await sendPanelMessage(panel);
    if (messageId) {
      await prisma.ticketPanel.update({
        where: { id: panel.id },
        data: { messageId }
      });
    }
    return res.json({ ok: true, messageId: messageId || null });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Send failed" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.ticketPanel.delete({ where: { id } }).catch(() => null);
  return res.json({ ok: true });
});

export default router;
