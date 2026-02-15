import prismaPkg from "@prisma/client";

const { PrismaClient, Role } = prismaPkg;

const prisma = new PrismaClient();

const OWNER_ID = process.env.OWNER_ID || "1435310225010987088";
const DEFAULT_IMAGE_URL =
  process.env.DEFAULT_IMAGE_URL ||
  "https://media.discordapp.net/attachments/1466953282004979735/1472360913733550204/b076c84d-b7fb-4e2e-8885-52c8b12331a9-138.png?ex=69924a74&is=6990f8f4&hm=43aab5f0071a2aa02541e5388557d3997bd1f2260af6ac884b022629c9cb9eab&=&format=webp&quality=lossless";

async function ensureOwner() {
  await prisma.user.upsert({
    where: { id: OWNER_ID },
    update: { role: Role.OWNER },
    create: { id: OWNER_ID, role: Role.OWNER, addedBy: OWNER_ID }
  });

  await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      imageUrl: DEFAULT_IMAGE_URL
    }
  });
}

async function getSettings() {
  return prisma.setting.findUnique({ where: { id: "singleton" } });
}

export { prisma, ensureOwner, getSettings, OWNER_ID };
