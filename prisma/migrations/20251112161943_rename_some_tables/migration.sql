/*
  Warnings:

  - You are about to drop the `workflow_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workflow_variant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."workflow_variant" DROP CONSTRAINT "workflow_variant_workflow_template_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."workflow_variant_params" DROP CONSTRAINT "workflow_variant_params_workflow_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."workflow_variant_tags" DROP CONSTRAINT "workflow_variant_tags_workflow_variant_id_fkey";

-- DropTable
DROP TABLE "public"."workflow_template";

-- DropTable
DROP TABLE "public"."workflow_variant";

-- CreateTable
CREATE TABLE "public"."workflow_templates" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_variants" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workflow_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "workflow_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_variants_name_key" ON "public"."workflow_variants"("name");

-- AddForeignKey
ALTER TABLE "public"."workflow_variants" ADD CONSTRAINT "workflow_variants_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "public"."workflow_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_variant_params" ADD CONSTRAINT "workflow_variant_params_workflow_variant_id_fkey" FOREIGN KEY ("workflow_variant_id") REFERENCES "public"."workflow_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_variant_tags" ADD CONSTRAINT "workflow_variant_tags_workflow_variant_id_fkey" FOREIGN KEY ("workflow_variant_id") REFERENCES "public"."workflow_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
