-- CreateEnum
CREATE TYPE "public"."UserWorkflowVariantRunStatus" AS ENUM ('new', 'in_progress', 'completed', 'failed');

-- CreateTable
CREATE TABLE "public"."user_workflow_variant_runs" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "workflow_variant_id" INTEGER NOT NULL,
    "status" "public"."UserWorkflowVariantRunStatus" NOT NULL DEFAULT 'new',
    "workflow_variant_run_params_id" INTEGER,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_workflow_variant_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_variant_run_params" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT NOT NULL,
    "params" JSONB NOT NULL,

    CONSTRAINT "workflow_variant_run_params_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_workflow_variant_run_idx" ON "public"."user_workflow_variant_runs"("user_id", "workflow_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_variant_run_params_hash_key" ON "public"."workflow_variant_run_params"("hash");

-- AddForeignKey
ALTER TABLE "public"."user_workflow_variant_runs" ADD CONSTRAINT "user_workflow_variant_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_workflow_variant_runs" ADD CONSTRAINT "user_workflow_variant_runs_workflow_variant_id_fkey" FOREIGN KEY ("workflow_variant_id") REFERENCES "public"."workflow_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_workflow_variant_runs" ADD CONSTRAINT "user_workflow_variant_runs_workflow_variant_run_params_id_fkey" FOREIGN KEY ("workflow_variant_run_params_id") REFERENCES "public"."workflow_variant_run_params"("id") ON DELETE SET NULL ON UPDATE CASCADE;
