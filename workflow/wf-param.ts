const params = {
  _example: {
    'type': 'integer',
    'default': 42,
    'description': 'Some description of the parameter',
    'label': 'Some Parameter',
    'compile': ({ params, extra }) => {
      return params._example || extra.defaultValue || 42
    },
  },
  filenamePrefix: {
    'type': 'string',
    'default': 'bot_img_',
    'description': 'Prefix for the generated image filenames',
    'label': 'Filename Prefix',
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
  model: {
    'type': 'string',
    'description': 'The model to use for generation',
    'label': 'Model',
  },
  model2: {
    'type': 'string',
    'description': 'The model to use for generation',
    'label': 'Model 2',
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
    'enum': ['euler', 'dpmpp_2m', 'heun', 'uni_pc'],
    'default': 'euler',
    'description': 'The sampler to use for image generation',
    'label': 'Sampler',
  },
  scheduler: {
    'type': 'string',
    'enum': ['normal', 'simple', 'karras', 'exponential'],
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
        return Math.floor(Math.random() * 4294967296) // 0..2^32-1
      }

      return Math.abs(parseInt(params.seedValue, 10)) || 42
    },
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

      console.log('\x1b[36m', 'width', width, '\x1b[0m')
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

export default params