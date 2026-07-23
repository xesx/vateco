import { Injectable } from '@nestjs/common'

import * as comfyuiObjectInfo from './object-info.json'
import * as wfMetaParamSchema from './meta-params.json'
import * as wfParamsExtraProps from './wfv-params-extra-props.json'

@Injectable()
export class WorkflowLibService {
  readonly comfyuiObjectInfo: Record<string, any> = comfyuiObjectInfo
  readonly wfMetaParamSchema = wfMetaParamSchema
  readonly wfParamsExtraProps = wfParamsExtraProps

  getWfNodeClassTypeSchema (classType: string): any {
    return this.comfyuiObjectInfo[classType]
  }

  getMetaParam (name) {
    name = name.split(':')[0]
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

      const keyEscaped = key.replace(/[-/\\^$*+?.()|[\]]/g, '\\$&')

      if (typeof value === 'string') {
        const re = new RegExp(`{{${keyEscaped}}}`, 'g')
        // Экранируем строку для безопасной вставки в JSON (убираем обрамляющие кавычки, которые добавляет JSON.stringify)
        const escapedValue = JSON.stringify(value).slice(1, -1)
        templateStr = templateStr.replace(re, escapedValue)
      } else {
        const re = new RegExp(`"{{${keyEscaped}}}"`, 'g')
        templateStr = templateStr.replace(re, String(value))
      }
    }

    try {
      const parsedTemplate = JSON.parse(templateStr)
      return parsedTemplate
    } catch (err) {
      throw new Error(`WorkflowLibService_compileWorkflow_91 Error parsing compiled template: ${err.message}\nTemplate string: ${templateStr}`)
    }
  }

  bypassWfvNodes ({ wfv, nodeIds }: { wfv: Record<string, any>, nodeIds: number[] | string[] }) {
    wfv = structuredClone(wfv)
    const nodeIdsSet = new Set(nodeIds.map(String))

    const isLink = (v) =>
      Array.isArray(v) && v.length === 2 &&
      (typeof v[0] === 'string' || typeof v[0] === 'number') &&
      typeof v[1] === 'number'

    // синонимы имён входов/выходов между разными классами нод
    const NAME_ALIASES = {
      pixels: ['image', 'images'],
      image: ['pixels', 'images'],
      images: ['image', 'pixels'],
      samples: ['latent_image', 'latent'],
      latent_image: ['samples', 'latent'],
      latent: ['samples', 'latent_image'],
      conditioning: ['positive', 'negative'],
    }

    const namesMatch = (a, b) => {
      if (a === b) return true
      if (NAME_ALIASES[a]?.includes(b)) return true
      if (NAME_ALIASES[b]?.includes(a)) return true
      return false
    }

    /**
     * Найти реальный источник для ссылки [nodeId, outputIndex],
     * "проходя сквозь" bypass-ноды (в т.ч. цепочки из нескольких).
     * inputName — имя входа у потребителя, помогает выбрать нужный вход.
     */
    function resolveSource(nodeId, outputIndex, inputName, seen = new Set()) {
      const id = String(nodeId)

      if (!nodeIdsSet.has(id)) {
        return [id, outputIndex]
      }

      if (seen.has(id)) {
        throw new Error(`byPassNodes: цикл при обходе bypass-нод (нода ${id})`)
      }

      seen.add(id)

      const node = wfv[id]
      if (!node) {
        throw new Error(`byPassNodes: нода ${id} не найдена в workflow`)
      }

      const linked = Object.entries(node.inputs ?? {}).filter(([, v]) => isLink(v))

      if (linked.length === 0) {
        throw new Error(
          `byPassNodes: нода ${id} (${node.class_type}) не имеет входов-связей — ` +
          `её нельзя bypass'нуть, потребители останутся без источника`
        )
      }

      // 1) точное/синонимичное совпадение по имени входа потребителя
      let candidate = linked.find(([name]) => namesMatch(name, inputName))

      // 2) позиционное соответствие: N-й выход -> N-й линкованный вход
      //    (работает для нод вида LoraLoader: outputs [MODEL, CLIP] <- inputs [model, clip])
      if (!candidate) candidate = linked[outputIndex]

      // 3) единственный линкованный вход — берём его
      if (!candidate && linked.length === 1) candidate = linked[0]

      if (!candidate) {
        throw new Error(
          `byPassNodes: не удалось сопоставить выход ${outputIndex} ноды ${id} ` +
          `(${node.class_type}) с её входами [${linked.map(([n]) => n).join(', ')}]`
        )
      }

      const [, [srcId, srcIdx]] = candidate as [string, [string, number]]

      // источник тоже может быть bypass-нодой — идём дальше по цепочке
      return resolveSource(srcId, srcIdx, inputName, seen)
    }

    // перенаправляем все ссылки в оставшихся нодах
    for (const [id, node] of Object.entries(wfv)) {
      if (nodeIdsSet.has(id) || !node?.inputs) {
        continue
      }

      for (const [inputName, value] of Object.entries(node.inputs)) {
        if (!isLink(value)) {
          continue
        }

        const [srcId, srcIdx] = value as [string, number]

        if (!nodeIdsSet.has(srcId)) {
          continue
        }

        node.inputs[inputName] = resolveSource(srcId, srcIdx, inputName)
      }
    }

    // удаляем bypass-ноды
    for (const id of nodeIdsSet) delete wfv[id]

    return wfv
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
