-- AlterTable
ALTER TABLE "public"."tg_bot_session" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "public"."workflow_template" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,

    CONSTRAINT "workflow_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_variant" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "workflow_template_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "workflow_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_variant_params" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "workflow_variant_id" INTEGER NOT NULL,
    "param_name" TEXT NOT NULL,
    "user" BOOLEAN NOT NULL,
    "value" JSONB NOT NULL,
    "label" TEXT,
    "enum" JSONB,
    "position_x" INTEGER,
    "position_y" INTEGER,

    CONSTRAINT "workflow_variant_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_variant_tags" (
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workflow_variant_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "public"."models" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "comfy_ui_directory" TEXT NOT NULL,
    "comfy_ui_file_name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "meta" JSONB NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."model_huggingface_links" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "model_id" INTEGER NOT NULL,
    "repo" TEXT NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "model_huggingface_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."model_tags" (
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_variant_name_key" ON "public"."workflow_variant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_variant_params_workflow_variant_id_param_name_key" ON "public"."workflow_variant_params"("workflow_variant_id", "param_name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_variant_tags_workflow_variant_id_tag_key" ON "public"."workflow_variant_tags"("workflow_variant_id", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "models_name_key" ON "public"."models"("name");

-- CreateIndex
CREATE UNIQUE INDEX "model_huggingface_links_repo_file_key" ON "public"."model_huggingface_links"("repo", "file");

-- CreateIndex
CREATE UNIQUE INDEX "model_tags_model_id_tag_key" ON "public"."model_tags"("model_id", "tag");

-- AddForeignKey
ALTER TABLE "public"."workflow_variant" ADD CONSTRAINT "workflow_variant_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "public"."workflow_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_variant_params" ADD CONSTRAINT "workflow_variant_params_workflow_variant_id_fkey" FOREIGN KEY ("workflow_variant_id") REFERENCES "public"."workflow_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_variant_tags" ADD CONSTRAINT "workflow_variant_tags_workflow_variant_id_fkey" FOREIGN KEY ("workflow_variant_id") REFERENCES "public"."workflow_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."model_huggingface_links" ADD CONSTRAINT "model_huggingface_links_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."model_tags" ADD CONSTRAINT "model_tags_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
