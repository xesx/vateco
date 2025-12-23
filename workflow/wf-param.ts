type TParam = {
  type: 'string' | 'integer' | 'boolean' | 'number'
  default?: string | number | boolean
  description: string
  label: string
  enum?: string[] | number[]
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
  baseShift: {
    type: 'number',
    default: 0.50,
    description: 'Parameter for ModelSamplingFlux node, input base_shift',
    label: 'baseShift',
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
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
  cfgNormStrength: {
    type: 'number',
    default: 1,
    description: 'Parameter for CFGNorm node, input strength',
    label: 'strength',
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
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
    enum: ['stable_diffusion', 'stable_cascade', 'sd3', 'stable_audio', 'mochi', 'ltxv', 'pixart', 'cosmos', 'lumina2', 'wan', 'hidream', 'chroma', 'ace', 'omnigen2', 'qwen_image', 'hunyuan_image', 'flux2', 'ovis'],
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
  dishonestyFactor: {
    type: 'number',
    default: -0.04,
    description: 'Parameter for LyingSigmaSampler node, input dishonesty_factor',
    label: 'dishonestyFactor',
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },
  endPercent: {
    type: 'number',
    default: 0.80,
    description: 'Parameter for LyingSigmaSampler node, input end_percent',
    label: 'endPercent',
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
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
    enum: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1],
    multiple: 20,
    positionX: 1000,
    positionY: 2,
  },
  maxShift: {
    type: 'number',
    default: 1.1500000000000001,
    description: 'Parameter for ModelSamplingFlux node, input max_shift',
    label: 'maxShift',
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },
  megapixels: {
    type: 'number',
    default: 1,
    description: 'Parameter for ImageScaleToTotalPixels node, input megapixels',
    label: 'megapixels',
    positionX: undefined,
    positionY: undefined,
    enum: [1, 1.5, 2, 2.5, 3, 4],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },
  model: {
    type: 'string',
    description: 'The model to use for generation',
    label: 'Model',
    isComfyUiModel: true,
    default: '❓',
    multiple: 5,
  },
  modelSamplingAuraFlowShift: {
    type: 'number',
    default: 3,
    description: 'Parameter for ModelSamplingAuraFlow node, input shift',
    label: 'shift',
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
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
    enum: ['euler','euler_cfg_pp','euler_ancestral','euler_ancestral_cfg_pp','heun','heunpp2','dpm_2','dpm_2_ancestral','lms','dpm_fast','dpm_adaptive','dpmpp_2s_ancestral','dpmpp_2s_ancestral_cfg_pp','dpmpp_sde','dpmpp_sde_gpu','dpmpp_2m','dpmpp_2m_cfg_pp','dpmpp_2m_sde','dpmpp_2m_sde_gpu','dpmpp_2m_sde_heun','dpmpp_2m_sde_heun_gpu','dpmpp_3m_sde','dpmpp_3m_sde_gpu','ddpm','lcm','ipndm','ipndm_v','deis','res_multistep','res_multistep_cfg_pp','res_multistep_ancestral','res_multistep_ancestral_cfg_pp','gradient_estimation','gradient_estimation_cfg_pp','er_sde','seeds_2','seeds_3','sa_solver','sa_solver_pece','ddim','uni_pc','uni_pc_bh2',],
    default: 'euler',
    description: 'The sampler to use for image generation',
    label: 'Sampler',
    positionX: 8000,
    positionY: 0,
  },
  scaleBy: {
    type: 'number',
    default: 1.00,
    description: 'Parameter for ImageScaleBy node, input scale_by',
    label: 'scaleBy',
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
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
  startPercent: {
    type: 'number',
    default: 0.25,
    description: 'Parameter for LyingSigmaSampler node, input start_percent',
    label: 'startPercent',
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
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
  upscaleMethod: {
    type: 'string',
    default: 'lanczos',
    description: 'Parameter for ImageScaleBy node, input upscale_method',
    label: 'upscaleMethod',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
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
  },

  pulidModel: {
    type: 'string',
    default: "pulid_flux_v0.9.1.safetensors",
    description: 'Parameter for PulidFluxModelLoader node, input pulid_file',
    label: 'pulidFile',
    isComfyUiModel: true,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  pulidFluxInsightFaceProvider: {
    type: 'string',
    default: 'CPU',
    description: 'Parameter for PulidFluxInsightFaceLoader node, input provider',
    label: 'provider',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  pulidFluxWeight: {
    type: 'number',
    default: 1,
    description: 'Parameter for ApplyPulidFlux node, input weight',
    label: 'weight',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  pulidFluxStartAt: {
    type: 'number',
    default: 0,
    description: 'Parameter for ApplyPulidFlux node, input start_at',
    label: 'startAt',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  pulidFluxEndAt: {
    type: 'number',
    default: 1,
    description: 'Parameter for ApplyPulidFlux node, input end_at',
    label: 'endAt',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  pulidFluxFusion: {
    type: 'string',
    default: "mean",
    description: 'Parameter for ApplyPulidFlux node, input fusion',
    label: 'fusion',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  pulidFluxFusionWeightMax: {
    type: 'number',
    default: 1,
    description: 'Parameter for ApplyPulidFlux node, input fusion_weight_max',
    label: 'fusionWeightMax',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  pulidFluxFusionWeightMin: {
    type: 'number',
    default: 0,
    description: 'Parameter for ApplyPulidFlux node, input fusion_weight_min',
    label: 'fusionWeightMin',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  pulidFluxTrainStep: {
    type: 'number',
    default: 1000,
    description: 'Parameter for ApplyPulidFlux node, input train_step',
    label: 'trainStep',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  pulidFluxUseGray: {
    type: 'boolean',
    default: true,
    description: 'Parameter for ApplyPulidFlux node, input use_gray',
    label: 'useGray',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  instantIdModel: {
    type: 'string',
    default: "ip-adapter.bin",
    description: 'Parameter for InstantIDModelLoader node, input instantid_file',
    label: 'instantidFile',
    isComfyUiModel: true,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  instantIdProvider: {
    type: 'string',
    default: 'CUDA',
    description: 'Parameter for InstantIDFaceAnalysis node, input provider',
    label: 'device',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  instantIdWeight: {
    type: 'number',
    default: 0.8,
    description: 'Parameter for ApplyInstantID node, input weight',
    label: 'weight',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  instantIdStartAt: {
    type: 'number',
    default: 0.02,
    description: 'Parameter for ApplyInstantID node, input start_at',
    label: 'startAt',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  instantIdEndAt: {
    type: 'number',
    default: 1,
    description: 'Parameter for ApplyInstantID node, input end_at',
    label: 'endAt',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  controlnetModel: {
    type: 'string',
    default: "diffusion_pytorch_model.safetensors",
    description: 'Parameter for ControlNetLoader node, input control_net_name',
    label: 'controlNetName',
    isComfyUiModel: true,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  clipVisionModel: {
    type: 'string',
    default: "sigclip_vision_patch14_384.safetensors",
    description: 'Parameter for CLIPVisionLoader node, input clip_name',
    label: 'clipV',
    isComfyUiModel: true,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  styleModel: {
    type: 'string',
    default: "flux1-redux-dev.safetensors",
    description: 'Parameter for StyleModelLoader node, input style_model_name',
    label: 'styleModelName',
    isComfyUiModel: true,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  clipVisionEncodeCrop: {
    type: 'string',
    default: "center",
    description: 'Parameter for CLIPVisionEncode node, input crop',
    label: 'crop',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  styleModelAStrength: {
    type: 'number',
    default: 1,
    description: 'Parameter for StyleModelApply node, input strength',
    label: 'strength',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  styleModelStrengthType: {
    type: 'string',
    default: "multiply",
    description: 'Parameter for StyleModelApply node, input strength_type',
    label: 'strengthType',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: undefined,
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  qwenVlModelName: {
    type: 'string',
    default: "Qwen3-VL-4B-Instruct",
    description: 'Parameter for AILab_QwenVL node, input model_name',
    label: 'modelName',
    isComfyUiModel: false, // todo
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: [
      'Qwen3-VL-2B-Instruct',
      // 'Qwen3-VL-2B-Thinking',
      // 'Qwen3-VL-2B-Instruct-FP8',
      // 'Qwen3-VL-2B-Thinking-FP8',
      'Qwen3-VL-4B-Instruct',
      // 'Qwen3-VL-4B-Thinking',
      // 'Qwen3-VL-4B-Instruct-FP8',
      // 'Qwen3-VL-4B-Thinking-FP8',
      'Qwen3-VL-8B-Instruct',
      // 'Qwen3-VL-8B-Thinking',
      // 'Qwen3-VL-8B-Instruct-FP8',
      // 'Qwen3-VL-8B-Thinking-FP8',
      'Qwen3-VL-32B-Instruct',
      // 'Qwen3-VL-32B-Thinking',
      // 'Qwen3-VL-32B-Instruct-FP8',
      // 'Qwen3-VL-32B-Thinking-FP8',
      // 'Qwen2.5-VL-3B-Instruct',
      // 'Qwen2.5-VL-7B-Instruct',
    ],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  qwenVlQuantization: {
    type: 'string',
    default: "None (FP16)",
    description: 'Parameter for AILab_QwenVL node, input quantization',
    label: 'quantization',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: ["None (FP16)", "8-bit (Balanced)", "4-bit (VRAM-friendly)"],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  qwenVlPresetPrompt: {
    type: 'string',
    default: "🖼️ Simple Description",
    description: 'Parameter for AILab_QwenVL node, input preset_prompt',
    label: 'presetPrompt',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: [
      '🖼️ Tags',
      '🖼️ Simple Description',
      '🖼️ Detailed Description',
      '🖼️ Ultra Detailed Description',
      '🎬 Cinematic Description',
      '🖼️ Detailed Analysis',
      '📹 Video Summary',
      '📖 Short Story',
      '🧩Prompt Refine & Expand',
    ],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  qwenVlCustomPrompt: {
    type: 'string',
    default: '',
    description: 'Parameter for AILab_QwenVL node, input custom_prompt',
    label: 'customPrompt',
    positionX: undefined,
    positionY: undefined,
    depends: undefined,
    compile: undefined,
  },

  qwenVlMaxTokens: {
    type: 'number',
    default: 256,
    description: 'Parameter for AILab_QwenVL node, input max_tokens',
    label: 'maxTokens',
    positionX: undefined,
    positionY: undefined,
    enum: [128, 256, 512, 1024, 2048, 4096],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  qwenVlKeepModelLoaded: {
    type: 'boolean',
    default: true,
    description: 'Parameter for AILab_QwenVL node, input keep_model_loaded',
    label: 'keepModelLoaded',
    positionX: undefined,
    positionY: undefined,
  },

  controlNetStrength: {
    type: 'number',
    default: 0.95,
    description: 'Parameter for ControlNetApplyAdvanced node, input strength',
    label: 'strength',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  controlNetStartPercent: {
    type: 'number',
    default: 0,
    description: 'Parameter for ControlNetApplyAdvanced node, input start_percent',
    label: 'startPercent',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: [0.05, 0.1, 0.15, 0.2, 0.3],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  controlNetEndPercent: {
    type: 'number',
    default: 1,
    description: 'Parameter for ControlNetApplyAdvanced node, input end_percent',
    label: 'endPercent',
    positionX: undefined,
    positionY: undefined,
    enum: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  controlNetPreprocessor: {
    type: 'string',
    default: "DepthAnythingPreprocessor",
    description: 'Parameter for AIO_Preprocessor node, input preprocessor',
    label: 'preprocessor',
    positionX: undefined,
    positionY: undefined,
    enum: [
      'none',
      // 'AnimeFace_SemSegPreprocessor',
      // 'AnyLineArtPreprocessor_aux',
      // 'BinaryPreprocessor',
      'CannyEdgePreprocessor',
      // 'ColorPreprocessor',
      // 'DensePosePreprocessor',
      'DepthAnythingPreprocessor',
      // 'Zoe_DepthAnythingPreprocessor',
      // 'DepthAnythingV2Preprocessor',
      // 'DSINE-NormalMapPreprocessor',
      // 'DWPreprocessor',
      // 'AnimalPosePreprocessor',
      // 'HEDPreprocessor',
      // 'FakeScribblePreprocessor',
      // 'LeReS-DepthMapPreprocessor',
      'LineArtPreprocessor',
      'AnimeLineArtPreprocessor',
      // 'LineartStandardPreprocessor',
      // 'Manga2Anime_LineArt_Preprocessor',
      // 'MediaPipe-FaceMeshPreprocessor',
      // 'MeshGraphormer-DepthMapPreprocessor',
      // 'Metric3D-DepthMapPreprocessor',
      // 'Metric3D-NormalMapPreprocessor',
      // 'MiDaS-NormalMapPreprocessor',
      // 'MiDaS-DepthMapPreprocessor',
      // 'M-LSDPreprocessor',
      // 'BAE-NormalMapPreprocessor',
      // 'OneFormer-COCO-SemSegPreprocessor',
      // 'OneFormer-ADE20K-SemSegPreprocessor',
      'OpenposePreprocessor',
      // 'PiDiNetPreprocessor',
      // 'PyraCannyPreprocessor',
      // 'ImageLuminanceDetector',
      // 'ImageIntensityDetector',
      'ScribblePreprocessor',
      // 'Scribble_XDoG_Preprocessor',
      // 'Scribble_PiDiNet_Preprocessor',
      // 'SAMPreprocessor',
      'ShufflePreprocessor',
      // 'TEEDPreprocessor',
      'TilePreprocessor',
      // 'TTPlanet_TileGF_Preprocessor',
      // 'TTPlanet_TileSimple_Preprocessor',
      // 'UniFormer-SemSegPreprocessor',
      // 'SemSegPreprocessor',
      // 'Zoe-DepthMapPreprocessor',
    ],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },

  controlNetResolution: {
    type: 'integer',
    default: 1024,
    description: 'Parameter for AIO_Preprocessor node, input resolution',
    label: 'resolution',
    isComfyUiModel: false,
    isMetaParam: false,
    positionX: undefined,
    positionY: undefined,
    enum: [512, 768, 1024, 1280, 1536, 2048],
    depends: undefined,
    multiple: undefined,
    compile: undefined,
  },
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