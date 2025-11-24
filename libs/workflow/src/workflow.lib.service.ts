import { Injectable } from '@nestjs/common'

import type { TWorkflow } from './type'

import workflowInfo from '../../../workflow'

@Injectable()
export class WorkflowLibService {
  readonly wfParamSchema = workflowInfo.param

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
      result[name] = sessionWfParams[name] || props?.value || props.default
    })

    return result
  }

  findWorkflowsByTags ({ tags = [] }: { tags: string[]}): TWorkflow[] {
    return Object.values(workflowInfo.variant)
      .filter((wf) => tags.every(tag => wf.tags.includes(tag)))
  }

  compileWorkflowV2 ({ workflow, params = {} }) {
    console.log('WorkflowLibService_compileWorkflow_10', JSON.stringify(params, null, 4))
    const compiledParams = this.compileWorkflowParams({ workflow, params })
    console.log('WorkflowLibService_compileWorkflow_20', JSON.stringify(compiledParams, null, 4))

    const compiledSchema = this.compileWorkflowSchema({ workflow, params: compiledParams })

    return {
      workflow: compiledSchema,
      params: compiledParams,
    }
  }

  compileWorkflowParams ({ workflow, params = {} }) {
    const compiledParams: any = {}

    const compiledParamsSet = new Set<string>()

    const workflowTemplateParams: string[] = []
    const re = new RegExp(`{{([a-zA-Z0-9]+)}}`, 'gm')
    const matches = JSON.stringify(workflow).matchAll(re)

    for (const match of matches) {
      const key = match[1]
      workflowTemplateParams.push(key)
    }

    Object.keys(params).forEach((key) => {
      if (!workflowTemplateParams.includes(key)) {
        workflowTemplateParams.push(key)
      }
    })

    let counter = 0
    while (compiledParamsSet.size < workflowTemplateParams.length) {
      counter++
      if (counter > 10) {
        throw new Error('WorkflowLibService_compileWorkflowParams_48 Too many iterations compiling params, possible circular dependency')
      }

      for (const key of workflowTemplateParams) {
        if (compiledParamsSet.has(key)) {
          continue
        }

        const paramInfo = workflowInfo.param[key]
        const rawValue = params[key] ?? paramInfo?.default

        if (paramInfo?.compile) {
          if (paramInfo.depends && !paramInfo.depends.every((depKey) => compiledParamsSet.has(depKey))) {
            continue
          }

          compiledParams[key] = paramInfo?.compile(rawValue, { ...params, ...compiledParams })
        } else {
          compiledParams[key] = rawValue
        }

        if (paramInfo.type === 'number') {
          compiledParams[key] = parseFloat(compiledParams[key].replace?.(',', '.') ?? compiledParams[key])
        }

        if (paramInfo.type === 'boolean') {
          compiledParams[key] = (String(compiledParams[key]) === 'true') || (compiledParams[key] === true)
        }

        compiledParamsSet.add(key)

        // TODO: validate param type
      }
    }

    return compiledParams
  }

  compileWorkflowSchema ({ workflow, params = {} }) {
    let templateStr = JSON.stringify(workflow)

    for (const key of Object.keys(params)) {
      const value = params[key] ?? workflowInfo.param[key]?.default

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
