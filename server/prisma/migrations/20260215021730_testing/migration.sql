-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "botClientId" TEXT,
ADD COLUMN     "botToken" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastPassword" TEXT;
