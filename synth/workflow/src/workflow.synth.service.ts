import { Injectable, Logger } from '@nestjs/common'

import * as lib from '@lib'

import { WorkflowCompilerSynthService } from './workflow-compiler.synth.service'

@Injectable()
export class WorkflowSynthService {
  private readonly l = new Logger(WorkflowSynthService.name)

  constructor(
    private readonly wflib: lib.WorkflowLibService,
    private readonly compiler: WorkflowCompilerSynthService,
  ) {}

  async compileEnum (name: string) {
    return await this.compiler[name]()
  }
}
