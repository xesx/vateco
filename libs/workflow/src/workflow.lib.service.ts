import { Injectable } from '@nestjs/common'

import type { TWorkflow } from './type'

import workflowInfo from '../../../workflow'

@Injectable()
export class WorkflowLibService {
  getWorkflow (id: string): TWorkflow {
    const workflow = workflowInfo.variant[id.toString()]

    if (!workflow) {
      throw new Error(`Workflow ${id} not found`)
    }

    Object.keys(workflow.params || {}).forEach((key) => {
      if (workflowInfo.param[key]) {
        workflow.params[key] = {
          ...workflowInfo.param[key],
          ...workflow.params[key],
        }
      }
    })

    return workflow
  }

  getWfParamsForSession ({ workflowId, sessionWfParams = {} }) {
    const workflow = this.getWorkflow(workflowId)
    const params = workflow.params

    const result = {}

    Object.entries(params).forEach(([name, props]) => {
      if (props.user !== true) {
        return
      }

      // установим значение по умолчанию, если параметр не задан
      result[name] = sessionWfParams || props?.value
    })

    return result
  }

  findWorkflowsByTags ({ tags = [] }: { tags: string[]}): TWorkflow[] {
    return Object.values(workflowInfo.variant)
      .filter((wf) => tags.every(tag => wf.tags.includes(tag)))
  }

  genSeed (): number {
    // Генерируем случайный seed
    const seed = Math.floor(Math.random() * 4294967296) // 0..2^32-1

    // Нормализуем под uint32
    return seed >>> 0
  }

  compileWorkflow ({ id, params = {} }) {
    const compiledParams = this.compileWorkflowParams({ id, params })
    const compiledSchema = this.compileWorkflowSchema({ id, params: compiledParams })

    return compiledSchema
  }

  compileWorkflowParams ({ id, params = {} }) {
    const workflow = this.getWorkflow(id)
    const compiledParams = {}

    // 2 passes to allow params to depend on each other
    for (let i = 0; i < 2; i++) {
      for (const key in workflow.params) {
        const paramInfo = workflowInfo.param[key]
        const rawValue = params[key] ?? workflow.params[key]?.value ?? paramInfo?.default

        if (paramInfo?.compile) {
          compiledParams[key] = paramInfo?.compile({ ...params, [key]: rawValue })
        } else {
          compiledParams[key] = rawValue
        }

        // TODO: validate param type
      }

      params = compiledParams
    }

    return compiledParams
  }

  compileWorkflowSchema ({ id, params = {} }) {
    const workflow = this.getWorkflow(id)
    const template = workflow.template

    let templateStr = JSON.stringify(template)

    for (const key of Object.keys(workflow.params)) {
      const value = params[key] ?? workflowInfo.param[key]?.value

      if (value === undefined) {
        throw new Error(`WorkflowLibService_compileWorkflow_13 Parameter <<${key}>> is required`)
      }

      let re = new RegExp(`{{${key}}}`, 'g')

      if (typeof value !== 'string') {
        re = new RegExp(`"{{${key}}}"`, 'g')
      }

      templateStr = templateStr.replace(re, String(value))
    }

    try {
      const parsedTemplate = JSON.parse(templateStr)
      return parsedTemplate
    } catch (err) {
      throw new Error(`WorkflowLibService_compileWorkflow_91 Error parsing compiled template: ${err.message}\nTemplate string: ${templateStr}`)
    }
  }
}
