/*
  Warnings:

  - Added the required column `descriptor_d` to the `leish_result` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "leish_result" ADD COLUMN     "descriptor_d" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "user_password_reset" ALTER COLUMN "valid_until" SET DEFAULT NOW() + interval '15 min';
