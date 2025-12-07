import { PrismaClient } from '@prisma/client'

const sourceDb = new PrismaClient({
  datasources: { db: { url: process.env.AMVERA_DATABASE_URL } }
})

const targetDb = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

async function copyTable() {
  const workflowTemplates = await sourceDb.workflowTemplates.findMany()

  for (const wft of workflowTemplates) {
    const workflowVariants = await sourceDb.workflowVariants.findMany({ where: { workflowTemplateId: wft.id } })

    try {
      const localWft = await targetDb.workflowTemplates.create({
        data: {
          name: wft.name,
          description: wft.description,
          schema: wft.schema,
        }
      })

      for (const wfv of workflowVariants) {
        const localWfv = await targetDb.workflowVariants.create({
          data: {
            workflowTemplateId: localWft.id,
            name: wfv.name,
            description: wfv.description,
          }
        })

        const workflowVariantParams = await sourceDb.workflowVariantParams.findMany({ where: { workflowVariantId: wfv.id } })
        await targetDb.workflowVariantParams.createMany({
          data: workflowVariantParams.map(param => ({
            workflowVariantId: localWfv.id,
            paramName: param.paramName,
            user: param.user,
            value: param.value,
            label: param.label,
            enum: param.enum,
            positionX: param.positionX,
            positionY: param.positionY,
          }))
        })

        const workflowVariantUserParams = await sourceDb.workflowVariantUserParams.findMany({ where: { workflowVariantId: wfv.id } })
        await targetDb.workflowVariantUserParams.createMany({
          data: workflowVariantUserParams.map(param => ({
            userId: param.userId,
            workflowVariantId: localWfv.id,
            paramName: param.paramName,
            value: param.value,
          }))
        })

        const workflowVariantTags = await sourceDb.workflowVariantTags.findMany({ where: { workflowVariantId: wfv.id } })
        await targetDb.workflowVariantTags.createMany({
          data: workflowVariantTags.map(tag => ({
            workflowVariantId: localWfv.id,
            tag: tag.tag,
          }))
        })
      }


      console.log(`✅ Copied workflow template ${wft.name} with id ${localWft.id}`);
    } catch (error) {
      console.log('Error copying workflow template', wft.name, error);
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
