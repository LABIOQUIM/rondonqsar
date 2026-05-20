/*
  Warnings:

  - You are about to drop the column `task_id` on the `leish_result` table. All the data in the column will be lost.
  - You are about to drop the column `task_id` on the `plasmo_result` table. All the data in the column will be lost.
  - You are about to drop the `leish_task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `plasmo_task` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `submission_id` to the `leish_result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submission_id` to the `plasmo_result` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "leish_result" DROP CONSTRAINT "leish_result_task_id_fkey";

-- DropForeignKey
ALTER TABLE "leish_task" DROP CONSTRAINT "leish_task_user_id_fkey";

-- DropForeignKey
ALTER TABLE "plasmo_result" DROP CONSTRAINT "plasmo_result_task_id_fkey";

-- DropForeignKey
ALTER TABLE "plasmo_task" DROP CONSTRAINT "plasmo_task_user_id_fkey";

-- DropIndex
DROP INDEX "leish_result_task_id_idx";

-- DropIndex
DROP INDEX "plasmo_result_task_id_idx";

-- AlterTable
ALTER TABLE "leish_result" DROP COLUMN "task_id",
ADD COLUMN     "submission_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "plasmo_result" DROP COLUMN "task_id",
ADD COLUMN     "submission_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_password_reset" ALTER COLUMN "valid_until" SET DEFAULT NOW() + interval '15 min';

-- DropTable
DROP TABLE "leish_task";

-- DropTable
DROP TABLE "plasmo_task";

-- CreateTable
CREATE TABLE "qsar_submission" (
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
    "plasmo_isolated_descriptors_path" TEXT,
    "leish_isolated_descriptors_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "qsar_submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qsar_submission_user_id_idx" ON "qsar_submission"("user_id");

-- CreateIndex
CREATE INDEX "leish_result_submission_id_idx" ON "leish_result"("submission_id");

-- CreateIndex
CREATE INDEX "plasmo_result_submission_id_idx" ON "plasmo_result"("submission_id");

-- AddForeignKey
ALTER TABLE "qsar_submission" ADD CONSTRAINT "qsar_submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plasmo_result" ADD CONSTRAINT "plasmo_result_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "qsar_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leish_result" ADD CONSTRAINT "leish_result_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "qsar_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
