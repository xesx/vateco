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
}
