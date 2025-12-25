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
    const extra = this.wfParamsExtraProps[`${classType}:${paramName}`]

    if (!paramInfo && !extra) {
      throw new Error(`WorkflowLibService_getWfNodeParamByFullName_32 Param not found: ${paramName} in class type: ${classType}`)
    }

    const [originalType, meta] = paramInfo || ['any', {}]

    let type = extra?.type

    if (!type) {
      if (originalType === 'INT') type = 'integer'
      if (originalType === 'FLOAT') type = 'number'
      if (originalType === 'BOOLEAN') type = 'boolean'

      if (originalType === 'STRING' || originalType === 'COMBO' || Array.isArray(originalType)) {
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

    if (!enumValues && Array.isArray(meta?.options) && meta.options.length > 0) {
      enumValues = meta.options
    }

    return { ...meta, ...extra, type, enum: enumValues }
  }

  compileWorkflowSchema ({ workflow, params = {} }) {
    let templateStr = JSON.stringify(workflow)

    for (const key of Object.keys(params)) {
      const value = params[key]

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
