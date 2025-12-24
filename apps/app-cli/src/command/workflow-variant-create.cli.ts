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
        // const { wfParamSchema } = this.wflib
        const { workflowTemplateId } = options

        const wfvId = await this.synthwf.createWorkflowVariant({ workflowTemplateId, name: 'test-wfv', description: 'some test description' })
        console.log('\x1b[36m', 'wfvId', wfvId, '\x1b[0m')

      })
  }
}
