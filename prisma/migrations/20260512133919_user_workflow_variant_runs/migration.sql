/*
  Warnings:

  - You are about to drop the `prompts` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserWorkflowVariantRunStatus" AS ENUM ('new', 'in_progress', 'completed', 'failed');

-- DropTable
DROP TABLE "public"."prompts";

-- CreateTable
CREATE TABLE "public"."user_workflow_variant_runs" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "workflow_variant_id" INTEGER NOT NULL,
    "status" "public"."UserWorkflowVariantRunStatus" NOT NULL DEFAULT 'new',
    "user_params" JSONB NOT NULL DEFAULT '{}',
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_workflow_variant_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_workflow_variant_run_idx" ON "public"."user_workflow_variant_runs"("user_id", "workflow_variant_id");

-- AddForeignKey
ALTER TABLE "public"."user_workflow_variant_runs" ADD CONSTRAINT "user_workflow_variant_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_workflow_variant_runs" ADD CONSTRAINT "user_workflow_variant_runs_workflow_variant_id_fkey" FOREIGN KEY ("workflow_variant_id") REFERENCES "public"."workflow_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
