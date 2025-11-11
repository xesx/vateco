-- AlterTable
ALTER TABLE "public"."model_huggingface_links" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."models" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "meta" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "public"."workflow_template" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."workflow_variant" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."workflow_variant_params" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
