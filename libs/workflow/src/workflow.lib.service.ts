import { Injectable } from '@nestjs/common'

import { wfParamSchema } from '../../../workflow'
import * as comfyuiObjectInfo from './object-info.json'
import * as wfMetaParamSchema from './meta-params.json'
import * as wfParamsExtraProps from './wfv-params-extra-props.json'

@Injectable()
export class WorkflowLibService {
  readonly comfyuiObjectInfo = comfyuiObjectInfo
  readonly wfMetaParamSchema = wfMetaParamSchema
  readonly wfParamsExtraProps = wfParamsExtraProps

  readonly wfParamSchema = wfParamSchema

  getWfNodeClassTypeSchema (classType: string): any {
    return this.comfyuiObjectInfo[classType]
  }

  getMetaParam (name) {
    return this.wfMetaParamSchema[name]
  }

  getWfvParamSchema (name: string): any {
    return this.getMetaParam(name) ?? this.getWfNodeParamByFullName(name)
  }

  getWfNodeParamByFullName (fullName: string): any {
    const [classType, paramName] = fullName.split(':')
    const classInfo = this.getWfNodeClassTypeSchema(classType)

    if (!classInfo) {
      throw new Error(`WorkflowLibService_getWfNodeParamByFullName_27 Class type not found: ${classType}`)
    }

    const paramInfo = classInfo.input.required?.[paramName] || classInfo.input.optional?.[paramName]
    const extra = wfParamsExtraProps[`${classType}:${paramName}`]

    if (!paramInfo && !extra) {
      throw new Error(`WorkflowLibService_getWfNodeParamByFullName_32 Param not found: ${paramName} in class type: ${classType}`)
    }

    const [originalType, meta] = paramInfo || ['any', {}]

    let type = extra?.type

    if (!type) {
      if (originalType === 'INT') type = 'integer'
      if (originalType === 'FLOAT') type = 'number'
      if (originalType === 'BOOLEAN') type = 'boolean'

      if (originalType === 'STRING' || Array.isArray(originalType)) {
        type = 'string'
      }
    }

    if (!type) {
      throw new Error(`WorkflowLibService_getWfNodeParamByFullName_42 Unknown param type: ${originalType} for param: ${paramName} in class type: ${classType}`)
    }

    let enumValues = extra?.enum

    if (!enumValues && Array.isArray(originalType) && originalType.length > 0) {
      enumValues = originalType
    }

    return { ...meta, ...extra, type, enum: enumValues }
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

      if (!workflowTemplateParams.includes(key)) {
        workflowTemplateParams.push(key)
      }
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
        console.log('WorkflowLibService_compileWorkflowParams_47', { compiledParams, compiledParamsSet, workflowTemplateParams })
        throw new Error('WorkflowLibService_compileWorkflowParams_48 Too many iterations compiling params, possible circular dependency')
      }

      for (const key of workflowTemplateParams) {
        if (compiledParamsSet.has(key)) {
          continue
        }

        const paramInfo = wfParamSchema[key]
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
      const value = params[key] ?? wfParamSchema[key]?.default

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

  getWorkflowTemplateParamKeys (workflow: any): string[] {
    const workflowTemplateParams: string[] = []
    const re = new RegExp(`{{([^"]+)}}`, 'gm')
    const matches = JSON.stringify(workflow).matchAll(re)

    for (const match of matches) {
      const key = match[1]
      workflowTemplateParams.push(key)
    }

    return workflowTemplateParams
  }

  generateSeed () {
    const seed = Math.floor(Math.random() * 4294967296)
    return seed >>> 0
  }
}
