import { globSync } from 'glob'
import { basename } from 'path'

import { packageDirectorySync } from 'pkg-dir'

import wfParam from './wf-param'

const rootDir = packageDirectorySync()
const wfVariantDir = `${rootDir}/workflow/variant`
const wfTemplateDir = `${rootDir}/workflow/template`

const wfVariantFiles = globSync(`${wfVariantDir}/**/*.variant.wf.json`)
const wfTemplateFiles = globSync(`${wfTemplateDir}/**/*.template.wf.json`)

const wfTemplate: { [key: string]: any } = {}

wfTemplateFiles.forEach(file => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const content = require(file)
  const name = basename(file).replace('.schema.wf.json', '')
  wfTemplate[name] = content
})

const wfVariant: { [key: string]: any } = {}

wfVariantFiles.forEach(file => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const content = require(file)
  content.template = wfTemplate[content.schema]

  if (!content.schema) {
    throw new Error(`Schema not found for parameter file: ${file}`)
  }

  const name = basename(file).replace('.param.wf.json', '')
  wfVariant[name] = content
})


export default {
  variant: wfVariant,
  param: wfParam,
}

