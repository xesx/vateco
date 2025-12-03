-- CreateTable
CREATE TABLE "public"."model_civitai_links" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model_id" INTEGER NOT NULL,
    "civitai_id" TEXT NOT NULL,
    "civitai_version_id" TEXT NOT NULL,

    CONSTRAINT "model_civitai_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "model_civitai_links_civitai_id_civitai_version_id_key" ON "public"."model_civitai_links"("civitai_id", "civitai_version_id");

-- AddForeignKey
ALTER TABLE "public"."model_civitai_links" ADD CONSTRAINT "model_civitai_links_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
