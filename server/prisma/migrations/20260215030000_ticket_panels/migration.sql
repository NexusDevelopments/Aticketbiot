-- CreateEnum
CREATE TYPE "PanelComponentType" AS ENUM ('BUTTON', 'DROPDOWN', 'TICKET');

-- AlterTable
ALTER TABLE "TicketPanel" ADD COLUMN     "title" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "componentType" "PanelComponentType" NOT NULL DEFAULT 'BUTTON',
ADD COLUMN     "buttonLabels" JSONB,
ADD COLUMN     "dropdownOptions" JSONB;
