import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = express.Router();

const logSchema = z.object({
  ticketId: z.string().min(2),
  userId: z.string().min(5),
  transcript: z.string().min(1)
});

router.get("/logs", async (req, res) => {
  const logs = await prisma.ticketLog.findMany({
    orderBy: { createdAt: "desc" }
  });
  return res.json(logs);
});

router.post("/logs", async (req, res) => {
  const parsed = logSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const log = await prisma.ticketLog.create({ data: parsed.data });
  return res.json(log);
});

export default router;
