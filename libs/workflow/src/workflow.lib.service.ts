import { Injectable } from '@nestjs/common'

import type { TWorkflow } from './type'

import workflowMap from '@workflow'

@Injectable()
export class WorkflowLibService {
  getWorkflow(id: string): TWorkflow {
    const workflow = workflowMap[id]

    if (!workflow) {
      throw new Error(`Workflow ${id} not found`)
    }

    return workflow
  }

  genSeed(): number {
    // Генерируем случайный seed
    const seed = Math.floor(Math.random() * 4294967296) // 0..2^32-1

    // Нормализуем под uint32
    return seed >>> 0
  }

  compileWorkflow ({ workflowId, workflowParams }) {
    const workflow = this.getWorkflow(workflowId)
    const schema = workflow.schema

    let compiled = JSON.stringify(schema)

    // replace {{key}} with value from workflowParams
    for (const [key, value] of Object.entries(workflowParams || {})) {
      if (key === 'seed') {
        const re = new RegExp(`"{{${key}}}"`, 'g')

        if (value === 'random') {
          // compiled = compiled.replace(re, String(this.genSeed()))
          compiled = compiled.replace(re, '-1') // comfyui random seed rgfree node required
        } else if (value === 'fixed') {
          const seedFixedValue = workflowParams['seedFixedValue'] || 42
          compiled = compiled.replace(re, seedFixedValue)
        } else {
          compiled = compiled.replace(re, String(value))
        }
      } else {
        const re = new RegExp(`{{${key}}}`, 'g')
        compiled = compiled.replace(re, String(value))
      }
    }

    return JSON.parse(compiled)
  }
}
