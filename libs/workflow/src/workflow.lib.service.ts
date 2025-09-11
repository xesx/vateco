import { Injectable } from '@nestjs/common'

import type { TWorkflow } from './type'

import workflowMap from '@workflow'

@Injectable()
export class WorkflowLibService {
  getWorkflow(id: string): TWorkflow {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const workflow: TWorkflow = workflowMap[id]

    if (!workflow) {
      throw new Error(`Workflow ${id} not found`)
    }

    return workflow
  }

  compileWorkflow ({ workflowId, workflowParams }) {
    const workflow = this.getWorkflow(workflowId)
    const schema = workflow.schema

    let compiled = JSON.stringify(schema)

    // replace {{key}} with value from workflowParams
    for (const [key, value] of Object.entries(workflowParams || {})) {
      const re = new RegExp(`{{${key}}}`, 'g')
      compiled = compiled.replace(re, String(value))
    }

    return JSON.parse(compiled)
  }
}
