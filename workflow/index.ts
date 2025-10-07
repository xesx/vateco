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

const variantIdSet = new Set<string>()

wfVariantFiles.forEach(file => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const variant = require(file)

  if (!variant.id) {
    throw new Error(`Workflow variant id is required in file: "${file}"`)
  }

  if (variantIdSet.has(variant.id)) {
    throw new Error(`Duplicate workflow variant id: ${variant.id} in file: "${file}"`)
  }

  variantIdSet.add(variant.id)

  if (!wfTemplate[variant.template]) {
    throw new Error(`Template not found for variant file: "${file}"`)
  }

  variant.template = wfTemplate[variant.template]

  // const name = basename(file).replace('.variant.wf.json', '')
  if (wfVariant[variant.id]) {
    console.log('\x1b[33m', `Duplicate workflow variant id: ${variant.id} in file "${file}"`, '\x1b[0m')
    return
  }

  const re = new RegExp(`{{([a-zA-Z0-9]+)}}`, 'gm')
  const matches = JSON.stringify(variant.template).matchAll(re)

  for (const match of matches) {
    const key = match[1]

    const commonParam = wfParam[key]
    const extraParam = variant.params?.[key] || {}

    variant.params[key] = { ...commonParam, ...extraParam }

    variant.params[key].value = extraParam.value ?? commonParam?.default
  }

  Object.keys(variant.params).forEach(key => {
    if (!wfParam[key]) {
      throw new Error(`Workflow_91 Unknown param "${key}" in variant file: "${file}"`)
    }
  })

  wfVariant[variant.id] = variant
})

export default {
  variant: wfVariant,
  param: wfParam,
}

