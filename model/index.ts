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

addParamToModel(illustriousLora, 'illustrious_lora', true)

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