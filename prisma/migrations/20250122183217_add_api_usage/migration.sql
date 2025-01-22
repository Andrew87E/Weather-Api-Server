-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiUsage_service_month_key" ON "ApiUsage"("service", "month");
