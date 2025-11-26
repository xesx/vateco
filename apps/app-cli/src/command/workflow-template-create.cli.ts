import * as fs from 'fs'

import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'


@Injectable()
export class WorkflowTemplateCreateCli {
  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly synthwf: synth.WorkflowSynthService,
    private readonly modelrepo: repo.ModelRepository,
  ) {}

  register(program) {
    program
      .command('create-workflow-template')
      .option('-f, --file <string>', 'Raw workflow file path')
      .description('Create workflow template')
      .action(async (options) => {
        const { file } = options

        if (!fs.existsSync(file)) {
          throw new Error(`File not found: ${file}`)
        }

        const rawWorkflow = JSON.parse(fs.readFileSync(file, 'utf-8'))

        const result = this.synthwf.cookWorkflowTemplate(rawWorkflow)

        console.log('\x1b[36m', 'content', JSON.stringify(result, null, 4), '\x1b[0m')
      })
  }
}
