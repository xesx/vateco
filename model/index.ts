import * as clip from './clip.model.json'
import * as flux from './flux.model.json'
import * as sd15 from './sd15.checkpoint.model.json'
import * as sdxl from './sdxl.checkpoint.model.json'
import * as illustrious from './illustrious.checkpoint.model.json'
import * as illustriousLora from './illustrious.lora.model.json'
import * as illustriousCN from './illustrious.controlnet.model.json'

function addParamToModel (models: Record<string, any>, key: string, value: any) {
  for (const modelName in models) {
    models[modelName].meta = models[modelName].meta || {}
    models[modelName].meta[key] = value
  }
}

function addTags (models: Record<string, any>, tags: string[]) {
  for (const modelName in models) {
    models[modelName].tag = models[modelName].tag || []
    models[modelName].tag = Array.from(new Set([...models[modelName].tag, ...tags]))
  }
}


addParamToModel(illustriousLora, 'illustrious_lora', true)

addTags(illustriousLora, ['illustrious', 'lora'])
addTags(illustriousCN, ['illustrious', 'controlnet'])
addTags(illustrious, ['illustrious', 'checkpoint', 'sd'])

// Add additional parameters to each model
const modelMap = {
  ...clip,
  ...flux,
  ...sd15,
  ...sdxl,
  ...illustrious,
  ...illustriousLora,
  ...illustriousCN,
}

export default modelMap