import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ensureOwner } from "./db.js";
import { startBot } from "./bot.js";
import authRoutes from "./routes/auth.js";
import settingsRoutes from "./routes/settings.js";
import usersRoutes from "./routes/users.js";
import blacklistRoutes from "./routes/blacklist.js";
import panelsRoutes from "./routes/panels.js";
import ticketsRoutes from "./routes/tickets.js";
import botRoutes from "./routes/bot.js";
import { authRequired, requireRole } from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 3001;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);

app.use("/api/settings", authRequired, settingsRoutes);
app.use("/api/blacklist", authRequired, blacklistRoutes);
app.use("/api/panels", authRequired, panelsRoutes);
app.use("/api/tickets", authRequired, ticketsRoutes);
app.use("/api/bot", authRequired, botRoutes);
app.use("/api/users", authRequired, requireRole(["OWNER"]), usersRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../../client/dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

async function start() {
  await ensureOwner();

  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (token && clientId) {
    await startBot({ token, clientId });
  }

  app.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
}

start();
