type TParam = {
  type: 'string' | 'integer' | 'boolean' | 'number'
  default?: string | number | boolean
  value?: string | number | boolean
  description: string
  label: string
  enum?: string[]
  multiple?: number
  isComfyUiModel?: boolean
  compile?: (params: Record<string, any>) => any
}

const params: Record<string, TParam> = {
  _example: {
    'type': 'integer',
    'default': 42,
    'description': 'Some description of the parameter',
    'label': 'Some Parameter',
    'multiple': 0,
    'compile': ({ params }) => {
      return params._example || 42
    },
  },
  cfg: {
    'type': 'number',
    'default': 1,
    'description': 'CFG Scale for generation',
    'label': 'CFG'
  },
  clipSkip: {
    'type': 'integer',
    'default': 1,
    'description': 'CLIP Skip value for generation',
    'label': 'CLIP Skip',
    'compile': (params) => {
      let clipSkip = parseInt(params.clipSkip, 10)
      clipSkip = Math.min(Math.max(Math.abs(clipSkip), 1), 24) // between 1 and 14
      clipSkip = -clipSkip // make it negative

      return clipSkip
    },
  },
  denoise: {
    'type': 'number',
    'default': 1,
    'description': 'Denoise strength for image-to-image generation',
    'label': 'Denoise',
    'compile': (params) => {
      let denoise = parseFloat(params.denoise) || 0
      denoise = Math.min(Math.abs(denoise), 1) // between 0 and 1

      return denoise
    },
  },
  filenamePrefix: {
    'type': 'string',
    'default': 'bot_img_',
    'description': 'Prefix for the generated image filenames',
    'label': 'Filename Prefix',
    'compile': (params) => {
      return `${params.filenamePrefix || 'img'}_${new Date().toJSON().replace(/[:.]/g, '-')}_`
    },
  },
  generationNumber: {
    'type': 'integer',
    'default': 1,
    'description': 'Number of items to generate',
    'label': 'Generation Number',
  },
  image: {
    'type': 'string',
    'default': 'N/A',
    'description': 'image name or URL',
    'label': 'Image',
  },
  fluxGuidance: {
    'type': 'number',
    'default': 2.5,
    'description': 'Flux Guidance Scale for generation',
    'label': 'Guidance',
  },
  lora: {
    'type': 'string',
    'description': 'The LoRa to use for generation',
    'label': 'Lora',
    'default': 'N/A',
    'isComfyUiModel': true,
    'multiple': 20,
  },
  loraEnabled: {
    'type': 'boolean',
    'description': 'Is LoRa enabled for generation',
    'default': false,
    'label': 'Lora enabled',
    'multiple': 20,
  },
  loraStrength: {
    'type': 'number',
    'description': 'The LoRa strength to use for generation',
    'default': 1.0,
    'label': 'Lora Strength',
    'multiple': 20,
  },
  model: {
    'type': 'string',
    'description': 'The model to use for generation',
    'label': 'Model',
    'isComfyUiModel': true,
    'multiple': 5,
  },
  negativePrompt: {
    'type': 'string',
    'default': 'Bad quality, low quality, blurry, watermark, text, error, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands and fingers, poorly drawn hands and fingers, poorly drawn face, deformed, blurry, dehydrated, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, fused fingers, too many fingers, long neck',
    'label': 'Negative Prompt',
    'description': 'The negative prompt to avoid certain elements in the image generation',
  },
  positivePrompt: {
    'type': 'string',
    'default': '',
    'description': 'The positive prompt to guide the image generation',
    'label': 'Positive Prompt',
  },
  sampler: {
    'type': 'string',
    'enum': ['euler', 'euler_ancestral','dpmpp_2m', 'heun', 'uni_pc', 'lcm'],
    'default': 'euler',
    'description': 'The sampler to use for image generation',
    'label': 'Sampler',
  },
  scheduler: {
    'type': 'string',
    'enum': ['normal', 'simple', 'karras', 'exponential', 'beta'],
    'default': 'normal',
    'description': 'The scheduler to use for image generation',
    'label': 'Scheduler',
  },
  seedType: {
    'type': 'string',
    'enum': ['fixed', 'random'],
    'default': 'random',
    'description': 'Type of seed to use, fixed or random',
    'label': 'Seed Type',
  },
  seedValue: {
    'type': 'integer',
    'default': 42,
    'description': 'The seed value to use when Seed Type is fixed',
    'label': 'Seed Value',
    'compile': (params) => {
      if (params.seedType === 'random') {
        const seed = Math.floor(Math.random() * 4294967296) // 0..2^32-1
        return seed >>> 0
      }

      const seed = Math.abs(parseInt(params.seedValue, 10)) || 42
      return seed >>> 0
    },
  },
  steps: {
    'type': 'integer',
    'default': 20,
    'description': 'Number of steps for the image generation process',
    'label': 'Steps',
  },
  width: {
    'type': 'integer',
    'default': 512,
    'description': 'Width of the generated image in pixels',
    'label': 'Width',
    'compile': (params) => {
      let width = parseInt(params.width, 10)

      // Clamp width to be multiple of 8
      if (width % 8 !== 0) {
        width = Math.round(width / 8) * 8
      }

      return width
    },
  },
  height: {
    'type': 'integer',
    'default': 512,
    'description': 'Height of the generated image in pixels',
    'label': 'Height',
    'compile': (params) => {
      let height = parseInt(params.height, 10)

      // Clamp height to be multiple of 8
      if (height % 8 !== 0) {
        height = Math.round(height / 8) * 8
      }

      return height
    },
  },
}

Object.entries(params).forEach(([key, param]) => {
  if (param.multiple) {
    for (let i = 0; i < param.multiple; i++) {
      params[`${key}${i + 1}`] = { ...param, label: `${param.label} ${i + 1}`, multiple: 0 }
    }
  }
})

export default params