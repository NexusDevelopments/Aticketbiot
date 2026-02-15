import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { JWT_SECRET } from "../middleware/auth.js";

const router = express.Router();

const loginSchema = z.object({
  userId: z.string().min(5),
  password: z.string().min(4)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { userId, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!user.passwordHash) {
    return res.status(403).json({ error: "Password not set" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "12h"
  });

  return res.json({ token, role: user.role, userId: user.id });
});

export default router;
