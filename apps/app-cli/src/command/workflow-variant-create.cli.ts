import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'


@Injectable()
export class WorkflowVariantCreateCli {
  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly synthwf: synth.WorkflowSynthService,
    private readonly wfrepo: repo.WorkflowRepository,
  ) {}

  register(program) {
    program
      .command('create-workflow-variant')
      .option('-w, --workflowTemplateId <number>', 'Workflow template ID')
      .description('Create workflow template')
      .action(async (options) => {
        const { wfParamSchema } = this.wflib
        const { workflowTemplateId } = options
        const prisma = this.wfrepo['prisma']

        const workflowTemplate = await this.wfrepo.getWorkflowTemplate(Number(workflowTemplateId))
        const paramKeys = this.wflib.getWorkflowTemplateParamKeys(workflowTemplate)
        const metaParamKeys = Object.entries(wfParamSchema)
          .filter(([, value]) => value.isMetaParam)
          .map(([key]) => key)

        const workflowVariantId = await prisma.$transaction(async (trx: lib.PrismaLibService) => {
          const workflowVariantId = await this.wfrepo.createWorkflowVariant({
            workflowTemplateId: Number(workflowTemplateId),
            name: workflowTemplate.name,
            description: workflowTemplate.description || '',
            trx,
          })

          await this.wfrepo.createWorkflowVariantTag({
            workflowVariantId,
            tag: 'new',
            trx,
          })

          let defaultPositionX = 7000

          for (const paramKey of [...metaParamKeys, ...paramKeys]) {
            const paramSchema = wfParamSchema[paramKey]

            if (!paramSchema) {
              throw new Error(`No schema found for workflow parameter: ${paramKey}`)
            }

            const endDigitMatch = paramKey.match(/\d+$/)
            const index = endDigitMatch ? parseInt(endDigitMatch[0], 10) : 0

            const positionX = (paramSchema.positionX ?? defaultPositionX) + index

            await this.wfrepo.createWorkflowVariantParam({
              workflowVariantId,
              paramName: paramKey,
              label: paramSchema.label || paramKey,
              value: paramSchema.default,
              user: true,
              enumValues: paramSchema.enum,
              positionX,
              positionY: paramSchema.positionY || 0,
              trx,
            })

            defaultPositionX += 10
          }

          return workflowVariantId
        })


        // await createWorkflowVariantParam({ workflowVariantId, paramName, label, value, positionX, positionY, user })
        // if (!fs.existsSync(file)) {
        //   throw new Error(`File not found: ${file}`)
        // }
        //
        // const rawWorkflow = JSON.parse(fs.readFileSync(file, 'utf-8'))
        //
        // // const result = this.synthwf.cookWorkflowTemplate(rawWorkflow)
        // const result = await this.synthwf.cookAndCreateWorkflowTemplate({
        //   rawWorkflow,
        //   name: 'flux-with-lora-v1',
        //   description: 'Base flux workflow with LoRA support',
        // })

        console.log('\x1b[36m', 'workflowVariantId:', workflowVariantId, '\x1b[0m')
      })
  }
}
