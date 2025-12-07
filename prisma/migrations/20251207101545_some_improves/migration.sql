-- AlterTable
ALTER TABLE "public"."models" ADD COLUMN     "base_model" TEXT NOT NULL DEFAULT 'undefined';

-- CreateTable
CREATE TABLE "public"."prompts" (
    "id" SERIAL NOT NULL,
    "prompt" TEXT NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompts_hash_key" ON "public"."prompts"("hash");

-- CreateIndex
CREATE INDEX "prompt_hash_idx" ON "public"."prompts"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "public"."tags"("name");
