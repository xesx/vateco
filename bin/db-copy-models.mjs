import { PrismaClient } from '@prisma/client'

const sourceDb = new PrismaClient({
  datasources: { db: { url: process.env.AMVERA_DATABASE_URL } }
})

const targetDb = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

async function copyTable() {
  const modelsSrc = await sourceDb.models.findMany()

  for (const model of modelsSrc) {
    const modelTags = await sourceDb.modelTags.findMany({ where: { modelId: model.id } })
    const hfLinks = await sourceDb.modelHuggingfaceLinks.findMany({ where: { modelId: model.id } })
    const civitaiLinks = await sourceDb.modelCivitaiLinks.findMany({ where: { modelId: model.id } })

    try {
      const localModel = await targetDb.models.create({
        data: {
          name: model.name,
          comfyUiDirectory: model.comfyUiDirectory,
          comfyUiFileName: model.comfyUiFileName,
          label: model.label,
          description: model.description,
          meta: model.meta,
        }
      })

      await targetDb.modelHuggingfaceLinks.createMany({
        data: hfLinks.map(link => ({
          modelId: localModel.id,
          repo: link.repo,
          file: link.file,
        }))
      })

      await targetDb.modelCivitaiLinks.createMany({
        data: civitaiLinks.map(link => ({
          modelId: localModel.id,
          civitaiId: link.civitaiId,
          civitaiVersionId: link.civitaiVersionId,
        }))
      })

      await targetDb.modelTags.createMany({
        data: modelTags.map(tag => ({
          modelId: localModel.id,
          tag: tag.tag,
        }))
      })

      console.log(`✅ Copied model ${model.name} with id ${localModel.id}`);
    } catch (error) {
      console.log('Error copying model', model.name, error);
    }
  }
}

async function main() {
  await copyTable() // 👈 имя модели из schema.prisma
}

main()
  .catch(console.error)
  .finally(async () => {
    await sourceDb.$disconnect()
    await targetDb.$disconnect()
  })
