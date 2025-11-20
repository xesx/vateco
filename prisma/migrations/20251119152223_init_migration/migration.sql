-- CreateEnum
CREATE TYPE "public"."WorkflowParamType" AS ENUM ('string', 'number', 'boolean');

-- CreateTable
CREATE TABLE "public"."tg_bot_sessions" (
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "tg_bot_sessions_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "telegram_id" INTEGER NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."workflow_variant_params" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workflow_variant_id" INTEGER NOT NULL,
    "param_name" TEXT NOT NULL,
    "user" BOOLEAN NOT NULL,
    "type" "public"."WorkflowParamType" NOT NULL,
    "value" JSONB,
    "label" TEXT,
    "enum" JSONB,
    "position_x" INTEGER,
    "position_y" INTEGER,

    CONSTRAINT "workflow_variant_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_variant_user_params" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "workflow_variant_id" INTEGER NOT NULL,
    "param_name" TEXT NOT NULL,
    "value" JSONB,

    CONSTRAINT "workflow_variant_user_params_pkey" PRIMARY KEY ("id")
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
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "comfy_ui_directory" TEXT NOT NULL,
    "comfy_ui_file_name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."model_huggingface_links" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
CREATE UNIQUE INDEX "users_telegram_id_key" ON "public"."users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_variants_name_key" ON "public"."workflow_variants"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_variant_params_workflow_variant_id_param_name_key" ON "public"."workflow_variant_params"("workflow_variant_id", "param_name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_variant_user_params_user_id_workflow_variant_id_pa_key" ON "public"."workflow_variant_user_params"("user_id", "workflow_variant_id", "param_name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_variant_tags_workflow_variant_id_tag_key" ON "public"."workflow_variant_tags"("workflow_variant_id", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "models_name_key" ON "public"."models"("name");

-- CreateIndex
CREATE UNIQUE INDEX "model_huggingface_links_repo_file_key" ON "public"."model_huggingface_links"("repo", "file");

-- CreateIndex
CREATE UNIQUE INDEX "model_tags_model_id_tag_key" ON "public"."model_tags"("model_id", "tag");

-- AddForeignKey
ALTER TABLE "public"."workflow_variants" ADD CONSTRAINT "workflow_variants_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "public"."workflow_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_variant_params" ADD CONSTRAINT "workflow_variant_params_workflow_variant_id_fkey" FOREIGN KEY ("workflow_variant_id") REFERENCES "public"."workflow_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_variant_user_params" ADD CONSTRAINT "workflow_variant_user_params_workflow_variant_id_fkey" FOREIGN KEY ("workflow_variant_id") REFERENCES "public"."workflow_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_variant_user_params" ADD CONSTRAINT "workflow_variant_user_params_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_variant_tags" ADD CONSTRAINT "workflow_variant_tags_workflow_variant_id_fkey" FOREIGN KEY ("workflow_variant_id") REFERENCES "public"."workflow_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."model_huggingface_links" ADD CONSTRAINT "model_huggingface_links_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."model_tags" ADD CONSTRAINT "model_tags_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
