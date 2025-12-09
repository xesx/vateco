import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'
import * as repo from '@repo'

import { WorkflowCompilerSynthService } from './workflow-compiler.synth.service'
import { WorkflowCookSynthService } from './workflow-cook.synth.service'
import { WorkflowViewSynthService } from './workflow-view.synth.service'

import * as cookNodeMap from './cook-node-map.json'

@Injectable()
export class WorkflowParamSynthService {
  private readonly l = new Logger(WorkflowParamSynthService.name)
  readonly cookNodeMap = cookNodeMap

  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly tgbotlib: lib.TgBotLibService,
    private readonly msglib: lib.MessageLibService,

    private readonly wfrepo: repo.WorkflowRepository,
    private readonly modelrepo: repo.ModelRepository,

    private readonly compiler: WorkflowCompilerSynthService,
    private readonly cook: WorkflowCookSynthService,
    readonly view: WorkflowViewSynthService,
  ) {}

  async getWfvParamInfo ({ wfvParamId }: { wfvParamId: number | string }) {
    const { wfParamSchema } = this.wflib

    const wfvParam = await this.wfrepo.getWorkflowVariantParamById(Number(wfvParamId))
    const paramName = wfvParam.paramName
    const workflowVariantId = wfvParam.workflowVariantId
    const wfvParamType = wfParamSchema[paramName].type

    const wfvParamEnum = wfvParam?.enum ?? wfParamSchema[paramName].enum

    return { wfvParam, paramName, workflowVariantId, wfvParamType, wfvParamEnum }
  }

  async getWfvUserParamInfo ({ wfvParamId, userId }: { wfvParamId: number | string; userId: number }) {
    const { wfParamSchema } = this.wflib

    const wfvParam = await this.wfrepo.getWorkflowVariantParamById(Number(wfvParamId))
    const paramName = wfvParam.paramName
    const workflowVariantId = wfvParam.workflowVariantId
    const wfvParamType = wfParamSchema[paramName].type
    const wfvParamEnum = wfvParam?.enum ?? wfParamSchema[paramName].enum

    const wfvUserParam = await this.wfrepo.findWorkflowVariantUserParam({ userId, workflowVariantId, paramName })
    const currentValue = (wfvUserParam?.value ?? wfvParam?.value ?? '❌') as string | number | boolean

    return { wfvParam, paramName, workflowVariantId, wfvParamType, currentValue, wfvParamEnum }
  }

  async toggleWfvUserParamBoolean ({ userId, wfvParamId }: { wfvParamId: number | string; userId: number }) {
    const { paramName, workflowVariantId, wfvParamType, currentValue } = await this.getWfvUserParamInfo({ wfvParamId, userId })

    if (wfvParamType !== 'boolean') {
      throw new Error(`WorkflowParamSynthService_toggleWfvUserParamBoolean_49 Parameter is not boolean: ${paramName}`)
    }

    await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value: !currentValue })
  }

  async setWfvUserParamValue ({ userId, wfvParamId, value }: { wfvParamId: number | string; userId: number; value: string | number | boolean }) {
    const { paramName, workflowVariantId } = await this.wfrepo.getWorkflowVariantParamById(Number(wfvParamId))
    await this.wfrepo.setWorkflowVariantUserParam({ userId, workflowVariantId, paramName, value })
  }
}
