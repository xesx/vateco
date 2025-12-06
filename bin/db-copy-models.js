import { PrismaClient } from '@prisma/client'

const sourceDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.AMVERA_DATABASE_URL,
    }
  }
})

const targetDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function copyTable() {
  const modelsSrc = await sourceDb.models.findMany()
  console.log('\x1b[36m', 'models', modelsSrc, '\x1b[0m');


  for (const model of modelsSrc) {
    const modelTags = await sourceDb.modelTags.findMany({
      where: { modelId: model.id }
    })

    const hfLinks = await sourceDb.modelHuggingfaceLinks.findMany({
      where: { modelId: model.id }
    })

    // console.log('\x1b[36m', 'hfLinks', hfLinks, '\x1b[0m');
    const civitaiLinks = await sourceDb.modelCivitaiLinks.findMany({
      where: { modelId: model.id }
    })

    // console.log('\x1b[36m', 'civitaiLinks', civitaiLinks, '\x1b[0m');
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

      // console.log(`✅ Copied model ${model.name} with id ${localModel.id}`);
    } catch (error) {
      console.log('Error copying model', model.name, error);
    }
  }

  // const modelsLocal = await targetDb.models.findMany()
  // console.log('\x1b[36m', 'models', modelsLocal, '\x1b[0m');
  // const model = sourceDb[tableName]
  // if (!model) throw new Error(`Model ${tableName} not found`)

  // let skip = 0
  // const batchSize = 1000

  // while (true) {
  //   const rows = await model.findMany({
  //     skip,
  //     take: batchSize,
  //   })
  //
  //   if (!rows.length) break
  //
  //   await targetDb.$transaction(
  //     rows.map((row) =>
  //       // @ts-ignore
  //       targetDb[tableName].upsert({
  //         where: { id: row.id },   // ⚠️ СМЕНИ id ЕСЛИ PK ДРУГОЙ
  //         create: row,
  //         update: row,
  //       }),
  //     ),
  //   )
  //
  //   skip += batchSize
  //   console.log(`✅ ${tableName}: скопировано ${skip}`)
  // }
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
