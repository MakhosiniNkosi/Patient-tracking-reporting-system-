-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "WeeklyReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UPLOADED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CAPTURER', 'VERIFIER', 'PROGRAM_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('COUNT', 'PERCENT', 'RATE_PER_DAY', 'RATE_PER_WEEK');

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facilityCode" TEXT NOT NULL,
    "district" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_cycles" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicators" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unitType" "UnitType" NOT NULL DEFAULT 'COUNT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicator_targets" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "targetValue" TEXT NOT NULL,

    CONSTRAINT "indicator_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CAPTURER',
    "facilityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "capturedById" TEXT,
    "verifiedBy" TEXT,
    "verifiedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_report_entries" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "monthly_report_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "weekLabel" TEXT NOT NULL,
    "status" "WeeklyReportStatus" NOT NULL DEFAULT 'DRAFT',
    "capturedById" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_report_entries" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "weekly_report_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "index_testing_referrals" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fileNo" TEXT NOT NULL,
    "riskReasons" TEXT[],
    "otherRisk" TEXT,
    "receivedBy" TEXT NOT NULL,
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "index_testing_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facilities_facilityCode_key" ON "facilities"("facilityCode");

-- CreateIndex
CREATE UNIQUE INDEX "performance_cycles_label_key" ON "performance_cycles"("label");

-- CreateIndex
CREATE UNIQUE INDEX "indicators_code_key" ON "indicators"("code");

-- CreateIndex
CREATE UNIQUE INDEX "indicator_targets_indicatorId_cycleId_key" ON "indicator_targets"("indicatorId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_facilityId_cycleId_month_key" ON "monthly_reports"("facilityId", "cycleId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_report_entries_reportId_indicatorId_key" ON "monthly_report_entries"("reportId", "indicatorId");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_facilityId_cycleId_month_weekLabel_key" ON "weekly_reports"("facilityId", "cycleId", "month", "weekLabel");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_report_entries_reportId_indicatorId_key" ON "weekly_report_entries"("reportId", "indicatorId");

-- AddForeignKey
ALTER TABLE "indicator_targets" ADD CONSTRAINT "indicator_targets_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicator_targets" ADD CONSTRAINT "indicator_targets_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "performance_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "performance_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_report_entries" ADD CONSTRAINT "monthly_report_entries_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "monthly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_report_entries" ADD CONSTRAINT "monthly_report_entries_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "performance_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_report_entries" ADD CONSTRAINT "weekly_report_entries_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_report_entries" ADD CONSTRAINT "weekly_report_entries_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "index_testing_referrals" ADD CONSTRAINT "index_testing_referrals_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
