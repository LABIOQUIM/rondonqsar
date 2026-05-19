-- AlterTable
ALTER TABLE "user_password_reset" ALTER COLUMN "valid_until" SET DEFAULT NOW() + interval '15 min';

-- CreateTable
CREATE TABLE "leish_task" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "job_id" TEXT,
    "error_message" TEXT,
    "report_path" TEXT,
    "output_path" TEXT,
    "isolated_descriptors_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "leish_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leish_result" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "molecule_number" INTEGER NOT NULL,
    "descriptor_a" DOUBLE PRECISION NOT NULL,
    "descriptor_b" DOUBLE PRECISION NOT NULL,
    "descriptor_c" DOUBLE PRECISION NOT NULL,
    "pec50" DOUBLE PRECISION NOT NULL,
    "ec50" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leish_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leish_task_user_id_idx" ON "leish_task"("user_id");

-- CreateIndex
CREATE INDEX "leish_result_task_id_idx" ON "leish_result"("task_id");

-- AddForeignKey
ALTER TABLE "leish_task" ADD CONSTRAINT "leish_task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leish_result" ADD CONSTRAINT "leish_result_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "leish_task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
