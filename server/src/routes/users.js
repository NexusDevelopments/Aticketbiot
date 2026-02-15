import express from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { sendPasswordDM } from "../bot.js";

const router = express.Router();

const addSchema = z.object({
  userId: z.string().min(5),
  role: z.enum(["OWNER", "ADMIN"]),
  addedBy: z.string().min(5)
});

const passwordSchema = z.object({
  userId: z.string().min(5),
  masterPassword: z.string().min(4),
  role: z.enum(["OWNER", "ADMIN"]).optional()
});

async function verifyMasterPassword(masterPassword) {
  const masterRaw = process.env.ADMIN_PASSWORD || "crxxr10032011";
  const masterHash = process.env.ADMIN_PASSWORD_HASH;
  if (masterHash) return bcrypt.compare(masterPassword, masterHash);
  return masterPassword === masterRaw;
}

router.get("/", async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return res.json(users);
});

router.get("/credentials", async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, lastPassword: true, addedBy: true }
  });
  return res.json(users);
});

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(user);
});

router.post("/", async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { userId, role, addedBy } = parsed.data;
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: { role, addedBy },
    create: { id: userId, role, addedBy }
  });

  return res.json(user);
});

router.post("/password", async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const ok = await verifyMasterPassword(parsed.data.masterPassword);
  if (!ok) return res.status(401).json({ error: "Invalid master password" });

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    await prisma.user.create({
      data: {
        id: parsed.data.userId,
        role: parsed.data.role || "ADMIN",
        addedBy: req.user?.userId || parsed.data.userId
      }
    });
  }

  const rawPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash, lastPassword: rawPassword }
  });

  const dmSent = await sendPasswordDM({
    userId: parsed.data.userId,
    password: rawPassword
  });

  return res.json({ password: rawPassword, dmSent });
});

router.delete("/:userId", async (req, res) => {
  const { userId } = req.params;
  await prisma.user.delete({ where: { id: userId } }).catch(() => null);
  return res.json({ ok: true });
});

export default router;
