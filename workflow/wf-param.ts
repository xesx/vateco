type TParam = {
  type: 'string' | 'integer' | 'boolean' | 'number'
  default?: string | number | boolean
  description: string
  label: string
  enum?: string[]
  multiple?: number
  isComfyUiModel?: boolean
  isMetaParam?: boolean
  depends?: string[]
  compile?: (rawValue: any, params: Record<string, any>) => any
  positionX?: number
  positionY?: number
}

const params: Record<string, TParam> = {
  _example: {
    type: 'integer',
    default: 42,
    description: 'Some description of the parameter',
    label: 'Some Parameter',
    multiple: 0,
    compile: (rawValue, params) => {
      return params.some || rawValue || 42
    },
  },
  batchSize: {
    type: 'integer',
    default: 1,
    description: 'The batch size for image generation',
    label: 'Batch Size',
  },
  cfg: {
    type: 'number',
    default: 1,
    description: 'CFG Scale for generation',
    label: 'CFG',
    positionX: 8500,
    positionY: 1,
  },
  checkpointModel: {
    type: 'string',
    description: 'The Checkpoint model to use for generation',
    label: 'Checkpoint Model',
    isComfyUiModel: true,
    default: '❓',
    multiple: 5,
  },
  clipDevice: {
    type: 'string',
    enum: ['cpu', 'default'],
    default: 'default',
    description: 'The device to use for CLIP model',
    label: 'CLIP Device',
  },
  clipLModel: {
    type: 'string',
    description: 'The CLIP-L model to use for generation',
    label: 'CLIP-L',
    isComfyUiModel: true,
    default: '❓',
    multiple: 5,
  },
  clipSkip: {
    type: 'integer',
    default: 1,
    description: 'CLIP Skip value for generation',
    label: 'CLIP Skip',
    positionX: 8500,
    positionY: 2,
    compile: (clipSkip) => {
      clipSkip = parseInt(clipSkip, 10)
      clipSkip = Math.min(Math.max(Math.abs(clipSkip), 1), 24) // between 1 and 14
      clipSkip = -clipSkip // make it negative

      return clipSkip
    },
  },
  clipType: {
    type: 'string',
    enum: ['sdxl', 'sd3', 'flux', 'hunyuan_video', 'hidream'],
    default: 'flux',
    description: 'The type of CLIP model to use',
    label: 'CLIP Type',
  },
  denoise: {
    type: 'number',
    default: 1,
    description: 'Denoise strength for image-to-image generation',
    label: 'Denoise',
    compile: (denoise) => {
      denoise = parseFloat(denoise) || 0
      denoise = Math.min(Math.abs(denoise), 1) // between 0 and 1

      return denoise
    },
  },
  device: {
    type: 'string',
    enum: ['cpu', 'cuda', 'default'],
    default: 'default',
    description: 'The device to use',
    label: 'Device',
  },
  filenamePrefix: {
    type: 'string',
    default: 'img',
    description: 'Prefix for the generated image filenames',
    label: 'Filename Prefix',
    compile: (filenamePrefix) => {
      filenamePrefix = String(filenamePrefix || 'img')
      filenamePrefix = `${filenamePrefix}_${Date.now()}`

      return filenamePrefix
    },
  },
  generationNumber: {
    type: 'integer',
    default: 1,
    description: 'Number of items to generate',
    label: 'Generation Number',
    isMetaParam: true,
    positionX: 0,
    positionY: 0,
  },
  guidance: {
    type: 'number',
    default: 3.5,
    description: 'Guidance scale for CLIP text encoding',
    label: 'Guidance',
    multiple: 5,
  },
  height: {
    type: 'integer',
    default: 512,
    description: 'Height of the generated image in pixels',
    label: 'Height',
    positionX: 10,
    positionY: 6,
    compile: (height) => {
      height = parseInt(height, 10)

      // Clamp height to be multiple of 8
      if (height % 8 !== 0) {
        height = Math.round(height / 8) * 8
      }

      return height
    },
  },
  image: {
    type: 'string',
    default: '❓',
    description: 'image name or URL',
    label: 'Image',
    positionX: 10,
    positionY: 0,
  },
  lora: {
    type: 'string',
    description: 'The LoRa to use for generation',
    label: '',
    default: '❓',
    isComfyUiModel: true,
    multiple: 20,
    positionX: 1000,
    positionY: 1,
  },
  loraEnabled: {
    type: 'boolean',
    description: 'Is LoRa enabled for generation',
    default: false,
    label: 'Lora on',
    multiple: 20,
    positionX: 1000,
    positionY: 0,
  },
  loraStrength: {
    type: 'number',
    description: 'The LoRa strength to use for generation',
    default: 1.0,
    label: '',
    multiple: 20,
    positionX: 1000,
    positionY: 2,
  },
  model: {
    type: 'string',
    description: 'The model to use for generation',
    label: 'Model',
    isComfyUiModel: true,
    default: '❓',
    multiple: 5,
  },
  negativePrompt: {
    type: 'string',
    default: 'Bad quality, low quality, blurry, watermark, text, error, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands and fingers, poorly drawn hands and fingers, poorly drawn face, deformed, blurry, dehydrated, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, fused fingers, too many fingers, long neck',
    label: 'Negative Prompt',
    description: 'The negative prompt to avoid certain elements in the image generation',
    positionX: 9000,
    positionY: 1,
  },
  positivePrompt: {
    type: 'string',
    default: '',
    description: 'The positive prompt to guide the image generation',
    label: 'Positive Prompt',
    positionX: 9000,
    positionY: 0,
  },
  sampler: {
    type: 'string',
    enum: ['euler', 'euler_ancestral', 'dpmpp_2m', 'heun', 'uni_pc', 'lcm'],
    default: 'euler',
    description: 'The sampler to use for image generation',
    label: 'Sampler',
    positionX: 8000,
    positionY: 0,
  },
  scheduler: {
    type: 'string',
    enum: ['normal', 'simple', 'karras', 'exponential', 'beta'],
    default: 'normal',
    description: 'The scheduler to use for image generation',
    label: 'Scheduler',
    positionX: 8000,
    positionY: 1,
  },
  seedType: {
    type: 'string',
    enum: ['fixed', 'random'],
    default: 'random',
    description: 'Type of seed to use, fixed or random',
    label: '',
    isMetaParam: true,
    positionX: 0,
    positionY: 1,
  },
  seedValue: {
    type: 'integer',
    default: 42,
    description: 'The seed value to use when Seed Type is fixed',
    label: '',
    depends: ['seedType'],
    positionX: 0,
    positionY: 2,
    compile: (seedValue, { seedType }) => {
      if (seedType === 'random') {
        const seed = Math.floor(Math.random() * 4294967296) // 0..2^32-1
        return seed >>> 0
      }

      const seed = Math.abs(parseInt(seedValue, 10)) || 42
      return seed >>> 0
    },
  },
  steps: {
    type: 'integer',
    default: 20,
    description: 'Number of steps for the image generation process',
    label: 'Steps',
    positionX: 8500,
    positionY: 0,
  },
  t5Model: {
    type: 'string',
    description: 'The T5 model to use for generation',
    label: 'T5',
    isComfyUiModel: true,
    default: '❓',
    multiple: 5,
  },
  unetModel: {
    type: 'string',
    description: 'The UNet model to use for generation',
    label: 'UNet Model',
    isComfyUiModel: true,
    default: '❓',
    multiple: 5,
  },
  unetWeightDtype: {
    type: 'string',
    // enum: [],
    default: 'default',
    description: 'The weight dtype for the UNet model',
    label: 'UNet Weight Dtype',
    multiple: 5,
    // depends: ['unetModel'],
  },
  vaeModel: {
    type: 'string',
    description: 'The VAE to use for generation',
    label: 'VAE',
    isComfyUiModel: true,
    default: '❓',
    multiple: 5,
  },
  width: {
    type: 'integer',
    default: 512,
    description: 'Width of the generated image in pixels',
    label: 'Width',
    positionX: 10,
    positionY: 5,
    compile: (width) => {
      width = parseInt(width, 10)

      // Clamp width to be multiple of 8
      if (width % 8 !== 0) {
        width = Math.round(width / 8) * 8
      }

      return width
    },
  }
}

Object.entries(params).forEach(([key, param]) => {
  if (param.multiple) {
    for (let i = 0; i < param.multiple; i++) {
      params[`${key}${i + 1}`] = { ...param, label: `${param.label} ${i + 1}`, multiple: 0 }
    }
  }
})

function assertNoCircularDependencies (visited: Set<string>, key: string) {
  if (visited.has(key)) {
    console.log('wf_param_assertNoCircularDependencies_13 Circular dependency detected:', Array.from(visited).join(' -> '), '->', key)
    throw new Error('CIRCULAR_DEPENDENCY_ERROR')
  }

  visited.add(key)

  const param = params[key]

  if (param.depends) {
    param.depends.forEach(depKey => {
      assertNoCircularDependencies(visited, depKey)
    })
  }

  visited.delete(key)
}

Object.entries(params).forEach(([key, param]) => {
  if (!param.depends) {
    return
  }

  assertNoCircularDependencies(new Set<string>(), key)
})

export const wfParamSchema = params