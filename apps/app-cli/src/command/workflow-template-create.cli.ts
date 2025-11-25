import * as fs from 'fs'

import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'


@Injectable()
export class WorkflowTemplateCreateCli {
  constructor(
    private readonly wflib: lib.WorkflowLibService,
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
        const result = {}
        console.log('\x1b[36m', 'rawWorkflow', rawWorkflow, '\x1b[0m')

        for (const key in rawWorkflow) {
          const node = rawWorkflow[key]

          const title = node._meta?.title
          const classType = node.class_type
          const imputs = node.inputs

          if (classType === 'Power Lora Loader (rgthree)') {
            node.inputs.lora_1 = { on: '{{loraEnabled1}}', lora: '{{lora1}}', strength: '{{loraStrength1}}'}
            node.inputs.lora_2 = { on: '{{loraEnabled2}}', lora: '{{lora2}}', strength: '{{loraStrength2}}'}
            node.inputs.lora_3 = { on: '{{loraEnabled3}}', lora: '{{lora3}}', strength: '{{loraStrength3}}'}
            node._meta.title = '#loraLoader'
          }

          result[key] = node
        }

        console.log('\x1b[36m', 'content', JSON.stringify(result, null, 4), '\x1b[0m')
      })
  }
}
