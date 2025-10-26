import modelMap from '@model'

export function ilLoraEnum (i) {
  const arr = Object.keys(modelMap)
    .filter(modelName =>
      modelMap[modelName].tag?.includes('illustrious') &&
      modelMap[modelName].tag?.includes('lora')
    )
    .map(modelName => ({
      label: modelMap[modelName].label || modelName,
      value: modelName,
    }))

  if (i) {
    return arr[i]
  }

  return arr
}

export function ilCheckpointEnum (i) {
  const arr = Object.keys(modelMap)
    .filter(modelName => modelName.startsWith('il_cp_'))
    .map(modelName => ({
      label: modelMap[modelName].label || modelName,
      value: modelName,
    }))

  if (i) {
    return arr[i]
  }

  return arr
}
