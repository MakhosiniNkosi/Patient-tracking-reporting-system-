/*
  Warnings:

  - The values [UPLOADED] on the enum `WeeklyReportStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `uploadedAt` on the `weekly_reports` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WeeklyReportStatus_new" AS ENUM ('DRAFT', 'SUBMITTED');
ALTER TABLE "weekly_reports" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "weekly_reports" ALTER COLUMN "status" TYPE "WeeklyReportStatus_new" USING ("status"::text::"WeeklyReportStatus_new");
ALTER TYPE "WeeklyReportStatus" RENAME TO "WeeklyReportStatus_old";
ALTER TYPE "WeeklyReportStatus_new" RENAME TO "WeeklyReportStatus";
DROP TYPE "WeeklyReportStatus_old";
ALTER TABLE "weekly_reports" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "weekly_reports" DROP COLUMN "uploadedAt",
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);
