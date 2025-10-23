import modelMap from '@model'

export function ilLoraEnum (i) {
  const arr = Object.keys(modelMap).filter(modelName => modelMap[modelName].meta?.illustrious_lora)

  if (i) {
    return arr[i]
  }

  return arr
}

export function ilCheckpointEnum (i) {
  const arr = Object.keys(modelMap).filter(modelName => modelName.startsWith('il_cp_'))

  if (i) {
    return arr[i]
  }

  return arr
}