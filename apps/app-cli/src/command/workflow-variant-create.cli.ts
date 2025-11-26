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
        console.log('\x1b[36m', 'workflowTemplate', workflowTemplate, '\x1b[0m')
        const paramKeys = this.wflib.getWorkflowTemplateParamKeys(workflowTemplate)
        console.log('\x1b[36m', 'paramKeys', paramKeys, '\x1b[0m')

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

          for (const paramKey of paramKeys) {
            const paramSchema = wfParamSchema[paramKey]

            if (!paramSchema) {
              throw new Error(`No schema found for workflow parameter: ${paramKey}`)
            }

            await this.wfrepo.createWorkflowVariantParam({
              workflowVariantId,
              paramName: paramKey,
              label: paramSchema.label || paramKey,
              value: paramSchema.default,
              positionX: paramSchema.positionX || 7000,
              positionY: paramSchema.positionY || 0,
              trx,
            })
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
