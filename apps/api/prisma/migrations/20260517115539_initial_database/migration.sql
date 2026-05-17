-- CreateEnum
CREATE TYPE "SYSTEM_MODE" AS ENUM ('ACTIVE', 'MAINTENANCE', 'DOWN');

-- CreateEnum
CREATE TYPE "FEATURE_FLAG_TYPE" AS ENUM ('BOOLEAN', 'STRING', 'NUMBER');

-- CreateTable
CREATE TABLE "settings" (
    "system_id" TEXT NOT NULL,
    "system_mode" "SYSTEM_MODE" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("system_id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL DEFAULT 'Name not set',
    "image" TEXT,
    "role" TEXT NOT NULL,
    "banned" BOOLEAN NOT NULL,
    "ban_reason" TEXT,
    "ban_expires" TIMESTAMP(3),
    "two_factor_enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backup_codes" TEXT NOT NULL,

    CONSTRAINT "two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "impersonated_by" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "id_token" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_password_reset" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usable" BOOLEAN NOT NULL DEFAULT true,
    "valid_until" TIMESTAMP(3) NOT NULL DEFAULT NOW() + interval '15 min',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_password_reset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "FEATURE_FLAG_TYPE" NOT NULL DEFAULT 'BOOLEAN',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_variant" TEXT NOT NULL,
    "variants" JSONB NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "feature_flag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_username_idx" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_id_key" ON "two_factor"("id");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_password_reset_id_key" ON "user_password_reset"("id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flag_key_key" ON "feature_flag"("key");

-- CreateIndex
CREATE INDEX "feature_flag_key_idx" ON "feature_flag"("key");

-- AddForeignKey
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_password_reset" ADD CONSTRAINT "user_password_reset_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
