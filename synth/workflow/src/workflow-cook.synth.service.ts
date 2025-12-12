import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
// import * as repo from '@repo'

@Injectable()
export class WorkflowCookSynthService {
  private readonly l = new Logger(WorkflowCookSynthService.name)

  constructor(
    private readonly wflib: lib.WorkflowLibService,
  ) {}

  cookRgfreePowerLoraLoaderNode (node: any) {
    node.inputs.lora_1 = { on: '{{loraEnabled1}}', lora: '{{lora1}}', strength: '{{loraStrength1}}'}
    node.inputs.lora_2 = { on: '{{loraEnabled2}}', lora: '{{lora2}}', strength: '{{loraStrength2}}'}
    node.inputs.lora_3 = { on: '{{loraEnabled3}}', lora: '{{lora3}}', strength: '{{loraStrength3}}'}
    node._meta.title = '#loraLoader'

    return node

  }

  cookVaeLoaderNode (node: any) {
    node.inputs.vae_name = "{{vaeModel}}"
    node._meta.title = '#vaeLoader'

    return node
  }

  cookUnetLoaderNode (node: any) {
    node.inputs.unet_name = "{{unetModel}}"
    node.inputs.weight_dtype = "{{unetWeightDtype}}"
    node._meta.title = '#unetLoader'

    return node
  }

  cookClipTextEncodeFluxNode (node: any) {
    node.inputs.guidance = "{{guidance}}"
    node._meta.title = '#CLIPTextEncodeFlux'

    return node
  }

  cookSaveImageNode (node: any) {
    node.inputs.filename_prefix = "{{filenamePrefix}}"
    node._meta.title = '#SaveImage'

    return node
  }

  cookKSamplerNode (node: any) {
    node.inputs.seed = "{{seedValue}}"
    node.inputs.steps = "{{steps}}"
    node.inputs.cfg = "{{cfg}}"
    node.inputs.sampler_name = "{{sampler}}"
    node.inputs.scheduler = "{{scheduler}}"
    node.inputs.denoise = "{{denoise}}"

    node._meta.title = '#KSampler'

    return node
  }

  cookDualCLIPLoaderNode (node: any) {
    node.inputs.clip_name1 = "{{clipLModel}}"
    node.inputs.clip_name2 = "{{t5Model}}"
    node.inputs.type = "{{clipType}}"
    node.inputs.device = "{{clipDevice}}"
    node._meta.title = '#DualCLIPLoader'

    return node
  }

  cookEmptyLatentImageNode (node: any) {
    node.inputs.width = "{{width}}"
    node.inputs.height = "{{height}}"
    node.inputs.batch_size = "{{batchSize}}"
    node._meta.title = '#EmptyLatentImage'

    return node
  }

  cookPrimitiveStringMultilineNode (node: any) {
    const title = node._meta.title

    if (!title.startsWith('@')) {
      return node
    }

    const paramKey = title.slice(1)
    node.inputs.value = `{{${paramKey}}}`

    return node
  }

  cookLoadImageNode (node: any) {
    node._meta.title = '#LoadImage'

    node.inputs.image = "{{image}}" // "start-image.png"

    return node
  }

  cookLyingSigmaSamplerNode (node: any) {
    node._meta.title = '#LyingSigmaSampler'

    node.inputs.dishonesty_factor = "{{dishonestyFactor}}" // -0.04000000000000001
    node.inputs.start_percent = "{{startPercent}}" // 0.25000000000000006
    node.inputs.end_percent = "{{endPercent}}" // 0.7000000000000002

    return node
  }

  cookBasicSchedulerNode (node: any) {
    node._meta.title = '#BasicScheduler'

    node.inputs.scheduler = "{{scheduler}}" // "simple"
    node.inputs.steps = "{{steps}}" // 15
    node.inputs.denoise = "{{denoise}}" // 1

    return node
  }

  cookKSamplerSelectNode (node: any) {
    node._meta.title = '#KSamplerSelect'

    node.inputs.sampler_name = "{{sampler}}" // "euler"

    return node
  }

  cookRandomNoiseNode (node: any) {
    node._meta.title = '#RandomNoise'

    node.inputs.noise_seed = "{{seedValue}}" // 914614111060696

    return node
  }

  cookModelSamplingFluxNode (node: any) {
    node._meta.title = '#ModelSamplingFlux'

    node.inputs.max_shift = "{{maxShift}}" // 1.1500000000000001
    node.inputs.base_shift = "{{baseShift}}" // 0.5000000000000001
    node.inputs.width = "{{width}}" // 1024
    node.inputs.height = "{{height}}" // 1024

    return node
  }

  cookFluxGuidanceNode (node: any) {
    node._meta.title = '#FluxGuidance'

    node.inputs.guidance = "{{guidance}}" // 2.5

    return node
  }

  cookImageScaleByNode (node: any) {
    node._meta.title = '#ImageScaleBy'

    node.inputs.upscale_method = "{{upscaleMethod}}" // "lanczos"
    node.inputs.scale_by = "{{scaleBy}}" // 1.0000000000000002

    return node
  }

  cookCFGNormNode (node: any) {
    node._meta.title = '#CFGNorm'

    node.inputs.strength = "{{cfgNormStrength}}" // 1

    return node
  }

  cookCLIPLoaderNode (node: any) {
    node._meta.title = '#CLIPLoader'

    node.inputs.clip_name = "{{clipLModel}}" // qwen_2.5_vl_7b_fp8_scaled.safetensors"
    node.inputs.type = "{{clipType}}" // "qwen_image"
    node.inputs.device = "{{clipDevice}}" // "default"

    return node
  }

  cookModelSamplingAuraFlowNode (node: any) {
    node._meta.title = '#ModelSamplingAuraFlow'

    node.inputs.shift = "{{modelSamplingAuraFlowShift}}" // 3

    return node
  }

  cookEmptySD3LatentImageNode (node: any) {
    node._meta.title = '#EmptySD3LatentImage'

    node.inputs.width = "{{width}}" // 2560
    node.inputs.height = "{{height}}" // 1440
    node.inputs.batch_size = "{{batchSize}}" // 1

    return node
  }

  cookImageScaleToTotalPixelsNode (node: any) {
    node._meta.title = '#ImageScaleToTotalPixels'

    node.inputs.upscale_method = "{{upscaleMethod}}" // "lanczos"
    node.inputs.megapixels = "{{megapixels}}" // 1

    return node
  }

  cookPulidFluxModelLoaderNode (node: any) {
    node._meta.title = '#PulidFluxModelLoader'

    node.inputs.pulid_file = "{{pulidModel}}" // "pulid_flux_v0.9.1.safetensors"

    return node
  }

  cookPulidFluxInsightFaceLoaderNode (node: any) {
    node._meta.title = '#PulidFluxInsightFaceLoader'

    node.inputs.provider = "{{pulidFluxInsightFaceProvider}}" // "CPU"

    return node
  }

  cookApplyPulidFluxNode (node: any) {
    node._meta.title = '#ApplyPulidFlux'

    node.inputs.weight = "{{pulidFluxWeight}}" // 1
    node.inputs.start_at = "{{pulidFluxStartAt}}" // 0
    node.inputs.end_at = "{{pulidFluxEndAt}}" // 1
    node.inputs.fusion = "{{pulidFluxFusion}}" // "mean"
    node.inputs.fusion_weight_max = "{{pulidFluxFusionWeightMax}}" // 1
    node.inputs.fusion_weight_min = "{{pulidFluxFusionWeightMin}}" // 0
    node.inputs.train_step = "{{pulidFluxTrainStep}}" // 1000
    node.inputs.use_gray = "{{pulidFluxUseGray}}" // true

    return node
  }

  cookCheckpointLoaderSimpleNode (node: any) {
    node._meta.title = '#CheckpointLoaderSimple'

    node.inputs.ckpt_name = "{{checkpointModel}}" // "il_honeys_10.safetensors"

    return node
  }

  cookInstantIDModelLoaderNode (node: any) {
    node._meta.title = '#InstantIDModelLoader'

    node.inputs.instantid_file = "{{instantIdModel}}" // "ip-adapter.bin"

    return node
  }

  cookInstantIDFaceAnalysisNode (node: any) {
    node._meta.title = '#InstantIDFaceAnalysis'

    node.inputs.provider = "{{instantIdProvider}}" // "CUDA"

    return node
  }

  cookApplyInstantIDNode (node: any) {
    node._meta.title = '#ApplyInstantID'

    node.inputs.weight = "{{instantIdWeight}}" // 0.8
    node.inputs.start_at = "{{instantIdStartAt}}" // 0.02
    node.inputs.end_at = "{{instantIdEndAt}}" // 1

    return node
  }

  cookControlNetLoaderNode (node: any) {
    node._meta.title = '#ControlNetLoader'

    node.inputs.control_net_name = "{{controlnetModel}}" // "diffusion_pytorch_model.safetensors"

    return node
  }


  cookCLIPVisionLoaderNode (node: any) {
    node._meta.title = '#CLIPVisionLoader'

    node.inputs.clip_name = "{{clipVisionModel}}" // "sigclip_vision_patch14_384.safetensors"

    return node
  }

  cookStyleModelLoaderNode (node: any) {
    node._meta.title = '#StyleModelLoader'

    node.inputs.style_model_name = "{{styleModel}}" // "flux1-redux-dev.safetensors"

    return node
  }

  cookCLIPVisionEncodeNode (node: any) {
    node._meta.title = '#CLIPVisionEncode'

    node.inputs.crop = "{{clipVisionEncodeCrop}}" // "center"

    return node
  }

  cookStyleModelApplyNode (node: any) {
    node._meta.title = '#StyleModelApply'

    node.inputs.strength = "{{styleModelAStrength}}" // 1
    node.inputs.strength_type = "{{styleModelStrengthType}}" // "multiply"

    return node
  }
}
