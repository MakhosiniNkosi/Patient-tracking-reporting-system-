-- AlterTable
ALTER TABLE "monthly_reports" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "weekly_reports" ADD COLUMN "archivedAt" TIMESTAMP(3);
