import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { startBot, stopBot, isBotRunning, sendBotMessage } from "../bot.js";
import { prisma, OWNER_ID } from "../db.js";

const router = express.Router();

const masterSchema = z.object({
  masterPassword: z.string().min(4)
});

const sendSchema = z.object({
  masterPassword: z.string().min(4),
  channelId: z.string().min(5),
  message: z.string().min(1)
});

async function verifyMasterPassword(masterPassword) {
  const masterRaw = process.env.ADMIN_PASSWORD || "crxxr10032011";
  const masterHash = process.env.ADMIN_PASSWORD_HASH;
  if (masterPassword === masterRaw) return true;
  if (masterHash) {
    const ok = await bcrypt.compare(masterPassword, masterHash);
    if (ok) return true;
  }

  const owner = await prisma.user.findUnique({ where: { id: OWNER_ID } });
  if (!owner?.passwordHash) return false;
  return bcrypt.compare(masterPassword, owner.passwordHash);
}

router.get("/status", async (req, res) => {
  return res.json({ running: isBotRunning() });
});

router.get("/invite", async (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) return res.json({ url: null });
  const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=8`;
  return res.json({ url });
});

router.post("/verify", async (req, res) => {
  const parsed = masterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const ok = await verifyMasterPassword(parsed.data.masterPassword);
  if (!ok) return res.status(401).json({ error: "Invalid master password" });

  return res.json({ ok: true });
});

router.post("/control/start", async (req, res) => {
  const parsed = masterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const ok = await verifyMasterPassword(parsed.data.masterPassword);
  if (!ok) return res.status(401).json({ error: "Invalid master password" });

  const settings = await prisma.setting.findUnique({ where: { id: "singleton" } });
  const token = settings?.botToken || process.env.DISCORD_BOT_TOKEN;
  const clientId = settings?.botClientId || process.env.DISCORD_CLIENT_ID;
  if (!token || !clientId) {
    return res.status(400).json({ error: "Missing bot token or client ID" });
  }

  await startBot({ token, clientId });
  return res.json({ running: true });
});

router.post("/control/stop", async (req, res) => {
  const parsed = masterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const ok = await verifyMasterPassword(parsed.data.masterPassword);
  if (!ok) return res.status(401).json({ error: "Invalid master password" });

  await stopBot();
  return res.json({ running: false });
});

router.post("/control/restart", async (req, res) => {
  const parsed = masterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const ok = await verifyMasterPassword(parsed.data.masterPassword);
  if (!ok) return res.status(401).json({ error: "Invalid master password" });

  const settings = await prisma.setting.findUnique({ where: { id: "singleton" } });
  const token = settings?.botToken || process.env.DISCORD_BOT_TOKEN;
  const clientId = settings?.botClientId || process.env.DISCORD_CLIENT_ID;
  if (!token || !clientId) {
    return res.status(400).json({ error: "Missing bot token or client ID" });
  }

  await stopBot();
  await startBot({ token, clientId });
  return res.json({ running: true });
});

router.post("/send", async (req, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const ok = await verifyMasterPassword(parsed.data.masterPassword);
  if (!ok) return res.status(401).json({ error: "Invalid master password" });

  await sendBotMessage({
    channelId: parsed.data.channelId,
    message: parsed.data.message
  });

  return res.json({ ok: true });
});

export default router;
