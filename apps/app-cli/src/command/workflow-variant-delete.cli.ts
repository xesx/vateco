import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'


@Injectable()
export class WorkflowVariantDeleteCli {
  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly synthwf: synth.WorkflowSynthService,
    private readonly wfrepo: repo.WorkflowRepository,
  ) {}

  register(program) {
    program
      .command('delete-workflow-variant')
      .option('-v, --workflowVariantId <number>', 'Workflow variant ID')
      .description('Delete workflow variant')
      .action(async (options) => {
        let { workflowVariantId } = options
        workflowVariantId = Number(workflowVariantId)

        const prisma = this.wfrepo['prisma']

        await this.wfrepo.getWorkflowVariant(workflowVariantId)

        await prisma.$transaction(async (trx: lib.PrismaLibService) => {
          await this.wfrepo.deleteWorkflowVariantTags({ workflowVariantId, trx })
          await this.wfrepo.deleteWorkflowVariantParams({ workflowVariantId, trx })
          await this.wfrepo.deleteWorkflowVariant({ workflowVariantId, trx })
        })

        console.log('\x1b[36m', 'deleted workflowVariantId:', workflowVariantId, '\x1b[0m')
      })
  }
}
