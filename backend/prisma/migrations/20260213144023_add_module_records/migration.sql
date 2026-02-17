-- CreateTable
CREATE TABLE "module_records" (
    "id" TEXT NOT NULL,
    "module_slug" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "module_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "module_records_module_slug_idx" ON "module_records"("module_slug");
