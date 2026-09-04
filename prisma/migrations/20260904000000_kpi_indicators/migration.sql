-- ตัวชี้วัดคุณภาพ (KPI/QI) นำเข้าจากแบบฟอร์มรายงานตัวชี้วัดรายปีงบประมาณของแต่ละงาน

CREATE TYPE "KpiKind" AS ENUM ('PERCENT', 'COUNT', 'DURATION', 'OTHER');

CREATE TABLE "KpiIndicator" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "KpiKind" NOT NULL DEFAULT 'PERCENT',
    "targetOp" TEXT,
    "targetValue" DOUBLE PRECISION,
    "targetRaw" TEXT NOT NULL DEFAULT '',
    "groupCode" TEXT NOT NULL DEFAULT '',
    "groupName" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "owner" TEXT,
    "summary" TEXT,

    CONSTRAINT "KpiIndicator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KpiValue" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "value" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "KpiValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KpiIndicator_workId_fiscalYear_code_key" ON "KpiIndicator"("workId", "fiscalYear", "code");
CREATE INDEX "KpiIndicator_workId_fiscalYear_idx" ON "KpiIndicator"("workId", "fiscalYear");
CREATE UNIQUE INDEX "KpiValue_indicatorId_month_key" ON "KpiValue"("indicatorId", "month");
CREATE INDEX "KpiValue_indicatorId_idx" ON "KpiValue"("indicatorId");

ALTER TABLE "KpiIndicator" ADD CONSTRAINT "KpiIndicator_workId_fkey"
    FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KpiValue" ADD CONSTRAINT "KpiValue_indicatorId_fkey"
    FOREIGN KEY ("indicatorId") REFERENCES "KpiIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
