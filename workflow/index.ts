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
  const name = basename(file).replace('.template.wf.json', '')
  wfTemplate[name] = content
})

const wfVariant: { [key: string]: any } = {}

wfVariantFiles.forEach(file => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const content = require(file)

  if (!wfTemplate[content.template]) {
    throw new Error(`Template not found for parameter file: ${file}`)
  }

  content.template = wfTemplate[content.template]

  // const name = basename(file).replace('.variant.wf.json', '')
  if (wfVariant[content.id]) {
    console.log('\x1b[33m', `Duplicate workflow variant id: ${content.id} in file ${file}`, '\x1b[0m')
    return
  }

  const re = new RegExp(`{{([a-zA-Z0-9]+)}}`, 'gm')
  const matches = JSON.stringify(content.template).matchAll(re)

  for (const match of matches) {
    const key = match[1]

    if (!content.params[key]){
      if (!wfParam[key].default) {
        throw new Error(`Parameter <<${key}>> in workflow ${content.id} has no default value and is not defined in params`)
      }

      content.params[key] = { user: false, value: wfParam[key].default }
    }
  }

  wfVariant[content.id] = content
})

export default {
  variant: wfVariant,
  param: wfParam,
}

