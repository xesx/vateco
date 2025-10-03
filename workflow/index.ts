import { globSync } from 'glob'
import { basename } from 'path'

import { packageDirectorySync } from 'pkg-dir'

import wfParam from './wf-param'

const rootDir = packageDirectorySync()
const wfSchemaParamsDir = `${rootDir}/workflow/wf-schema-params`
const wfSchemaDir = `${rootDir}/workflow/wf-schema`

const wfSchemaParamsFiles = globSync(`${wfSchemaParamsDir}/**/*.param.wf.json`)
const wfSchemaFiles = globSync(`${wfSchemaDir}/**/*.schema.wf.json`)

const wfSchema: { [key: string]: any } = {}

wfSchemaFiles.forEach(file => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const content = require(file)
  const name = basename(file).replace('.schema.wf.json', '')
  wfSchema[name] = content
})

const wfSchemaParams: { [key: string]: any } = {}

wfSchemaParamsFiles.forEach(file => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const content = require(file)
  content.schema = wfSchema[content.schema]

  if (!content.schema) {
    throw new Error(`Schema not found for parameter file: ${file}`)
  }

  const name = basename(file).replace('.param.wf.json', '')
  wfSchemaParams[name] = content
})


export default {
  schema: wfSchemaParams,
  param: wfParam,
}

