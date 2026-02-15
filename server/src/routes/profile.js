import express from "express";
import { prisma } from "../db.js";

function getAvatarUrl(user) {
  if (!user?.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
}

const router = express.Router();

router.get("/", async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const settings = await prisma.setting.findUnique({ where: { id: "singleton" } });
  const botToken = settings?.botToken || process.env.DISCORD_BOT_TOKEN;

  let discord = null;
  if (botToken) {
    const resp = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` }
    }).catch(() => null);
    if (resp?.ok) {
      const data = await resp.json();
      discord = {
        id: data.id,
        username: data.username,
        displayName: data.global_name || data.username,
        avatarUrl: getAvatarUrl(data)
      };
    }
  }

  return res.json({
    id: user.id,
    role: user.role,
    addedBy: user.addedBy,
    createdAt: user.createdAt,
    discord
  });
});

export default router;
