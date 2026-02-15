-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "passwordHash" TEXT,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "guildId" TEXT,
    "websiteUrl" TEXT,
    "blacklistChannelId" TEXT,
    "ticketLogChannelId" TEXT,
    "panelChannelId" TEXT,
    "imageUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "BlacklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketPanel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_userId_key" ON "LoginAttempt"("userId");
