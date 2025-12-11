import * as fs from 'fs'

import { Injectable } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'
import * as synth from '@synth'


const IGNORE_INPUT_KEYS = [
  'speak_and_recognation',
  'PowerLoraLoaderHeaderWidget',
]

// const IGNORE_NODE_CLASSES = [
//   'Power Lora Loader (rgthree)',
//   'PrimitiveStringMultiline',
//   'SaveImage',
//   'UNETLoader',
//   'VAELoader',
//   'DualCLIPLoader',
//   'VAELoader',
//   'UNETLoader',
//   'CLIPTextEncodeFlux',
//   'SaveImage',
//   'DualCLIPLoader',
//   'EmptyLatentImage',
//   'KSampler',
//   'PrimitiveStringMultiline',
// ]

function toCamelCase (str: string): string {
  return str.replace(/([-_ ][a-z])/gi, (group) =>
    group.toUpperCase()
      .replace('-', '')
      .replace('_', '')
      .replace(' ', '')
  )
}

@Injectable()
export class WorkflowParseCli {
  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly wfsynth: synth.WorkflowSynthService,
    private readonly modelrepo: repo.ModelRepository,
  ) {}

  register(program) {
    program
      .command('parse-workflow')
      .option('-f, --file <string>', 'Parse workflow file path')
      .description('Parse workflow')
      .action((options) => {
        const { file } = options

        const IGNORE_NODE_CLASSES = Object.keys(this.wfsynth.cookNodeMap)

        if (!fs.existsSync(file)) {
          throw new Error(`File not found: ${file}`)
        }

        const rawWorkflow = JSON.parse(fs.readFileSync(file, 'utf-8'))
        const sagnificantNodes = {}
        const sagnificantInputs = {}

        for (const key in rawWorkflow) {
          const node = rawWorkflow[key]
          const classType = node.class_type
          const title = node._meta?.title || ''

          // console.log(`--> ${classType} | ${title}`)

          if (IGNORE_NODE_CLASSES.includes(classType)) {
            continue
          }

          if (sagnificantNodes[classType]) {
            console.log('\x1b[36m', 'Duplicate CLASS NODE', classType, title, JSON.stringify(sagnificantNodes[classType], null, 4), '\x1b[0m')
            console.log('\x1b[36m', '---------------------------------------------------------------------------------', '\x1b[0m')
          }

          for (const inputKey in node.inputs) {
            const inputValue = node.inputs[inputKey]

            if (Array.isArray(inputValue) && inputValue.length === 2) {
              const [a, b] = inputValue
              if (typeof a === 'string' && typeof b === 'number') {
                continue
              }
            }

            if (IGNORE_INPUT_KEYS.includes(inputKey)) {
              continue
            }

            if (!['string', 'number', 'boolean'].includes(typeof inputValue)) {
              console.log('\x1b[36m', '----> difficult input:', inputKey, inputValue, '\x1b[0m')
              console.log('\x1b[36m', '---------------------------------------------------------------------------------', '\x1b[0m')
            }

            if (sagnificantInputs[inputKey]) {
              console.log('\x1b[36m', `Duplicate INPUT KEY: "${inputKey}" in "${classType} | ${title}"\n`, JSON.stringify(sagnificantInputs[inputKey]), '\x1b[0m')
              console.log('\x1b[36m', '---------------------------------------------------------------------------------', '\x1b[0m')
              sagnificantInputs[inputKey].push(`${classType} | ${title} --> ${inputValue}`)
            } else {
              sagnificantInputs[inputKey] = [`${classType} | ${title} --> ${inputValue}`]
            }

            sagnificantNodes[classType] = sagnificantNodes[classType] || { title, inputs: {} }
            sagnificantNodes[classType].inputs[inputKey] = inputValue
          }
        }

        console.log(JSON.stringify(sagnificantNodes, null, 4))
        const nodeClassFunctionMap = {}
        const wfParams = {}

        for (const node in sagnificantNodes) {
          const funcName = `cook${toCamelCase(node)}Node`
          nodeClassFunctionMap[node] = funcName

          let func = `${funcName} (node: any) {\n`
          func += `  node._meta.title = '#${node}'\n\n`

          for (const inputKey in sagnificantNodes[node].inputs) {
            const inputValue = sagnificantNodes[node].inputs[inputKey]
            const wfParamKey = toCamelCase(inputKey)
            func += `  node.inputs.${inputKey} = "{{${wfParamKey}}}" // ${JSON.stringify(inputValue)}\n`

            // type: 'string' | 'integer' | 'boolean' | 'number'
            // default?: string | number | boolean
            // description: string
            // label: string
            // enum?: string[]
            // multiple?: number
            // isComfyUiModel?: boolean
            // isMetaParam?: boolean
            // depends?: string[]
            // compile?: (rawValue: any, params: Record<string, any>) => any
            // positionX?: number
            // positionY?: number

            if (!wfParams[toCamelCase(wfParamKey)]) {
              wfParams[toCamelCase(wfParamKey)] = {
                type: typeof inputValue,
                default: inputValue,
                description: `Parameter for ${node} node, input ${inputKey}`,
                label: wfParamKey,
                isComfyUiModel: false,
                isMetaParam: false,
                positionX: undefined,
                positionY: undefined,
                'enum': undefined,
                depends: undefined,
                multiple: undefined,
                compile: undefined,
              }
            }
          }

          func += `\n  return node\n`
          func += `}\n`

          console.log('\x1b[36m', func, '\x1b[0m')
        }

        console.log('\x1b[36m', '---------------------------------------------------------------------------------', '\x1b[0m')
        console.log('\x1b[36m', 'nodeClassFunctionMap', JSON.stringify(nodeClassFunctionMap, null, 4), '\x1b[0m')
        console.log('\x1b[36m', '---------------------------------------------------------------------------------', '\x1b[0m')

        // cfg: {
        //    type: 'number',
        //    default: 1,
        //     description: 'CFG Scale for generation',
        //     label: 'CFG',
        //     positionX: 8500,
        //     positionY: 1,
        // },
        for (const key in wfParams) {
          let paramDef = `  ${key}: {\n`
          paramDef += `    type: '${wfParams[key].type}',\n`
          paramDef += `    default: ${JSON.stringify(wfParams[key].default)},\n`
          paramDef += `    description: '${wfParams[key].description}',\n`
          paramDef += `    label: '${wfParams[key].label}',\n`
          paramDef += `    isComfyUiModel: false,\n`
          paramDef += `    isMetaParam: false,\n`
          paramDef += `    positionX: undefined,\n`
          paramDef += `    positionY: undefined,\n`
          paramDef += `    enum: undefined,\n`
          paramDef += `    depends: undefined,\n`
          paramDef += `    multiple: undefined,\n`
          paramDef += `    compile: undefined,\n`
          paramDef += `  },\n`
          console.log('\x1b[36m', paramDef, '\x1b[0m')
        }

        // console.log('\x1b[36m', 'content', JSON.stringify(rawWorkflow, null, 4), '\x1b[0m')
      })
  }
}
