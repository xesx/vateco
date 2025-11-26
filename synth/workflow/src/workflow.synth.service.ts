import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

import { WorkflowCompilerSynthService } from './workflow-compiler.synth.service'
import { WorkflowCookSynthService } from './workflow-cook.synth.service'

import * as cookNodeMap from './cook-node-map.json'

@Injectable()
export class WorkflowSynthService {
  private readonly l = new Logger(WorkflowSynthService.name)

  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly compiler: WorkflowCompilerSynthService,
    private readonly cook: WorkflowCookSynthService,
  ) {}

  async compileEnum (name: string) {
    return await this.compiler[name]()
  }

  cookWorkflowTemplate (rawWorkflow: any) {
    const cookedWorkflow = {}

    for (const key in rawWorkflow) {
      const node = rawWorkflow[key]
      const classType = node.class_type
      const title = node._meta?.title || ''

      let cookFunctionName = cookNodeMap[classType]

      if (title.startsWith('@')) {
        cookFunctionName = cookNodeMap[title]

        if (!cookFunctionName) {
          throw new Error(`WorkflowSynthService_cookWorkflow_41 No cook function mapped for special node title: ${title}`)
        }
      }

      if (cookFunctionName) {
        if (typeof this.cook[cookFunctionName] !== 'function') {
          throw new Error(`WorkflowSynthService_cookWorkflow_45 Cook function not found: ${cookFunctionName} for node title: ${title}`)
        }
        cookedWorkflow[key] = this.cook[cookFunctionName](node)
      } else {
        // console.log('\x1b[36m', 'skip', classType, title, cookFunctionName, this.cook[cookFunctionName], '\x1b[0m')
        console.log(`WorkflowSynthService_cookWorkflow_52 Skipping cook for node with class_type: ${classType}, title: ${title}`)
        cookedWorkflow[key] = node
      }
    }

    this.validateWorkflowTemplate(cookedWorkflow)

    return cookedWorkflow
  }

  validateWorkflowTemplate (workflowTemplate: any) {
    const { wfParamSchema } = this.wflib

    const paramKeys = this.wflib.getWorkflowTemplateParamKeys(workflowTemplate)

    for (const key of paramKeys) {
      if (!wfParamSchema[key]) {
        throw new Error(`WorkflowSynthService_validateWorkflowTemplate_62 Unknown workflow parameter key: ${key}`)
      }
    }

    return true
  }
}
