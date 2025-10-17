import { Injectable } from '@nestjs/common'

import * as lib from '@lib'

@Injectable()
export class WfCompileCli {
  constructor(
    private readonly wflib: lib.WorkflowLibService,
  ) {}

  register(program) {
    program
      .command('wf-compile <name>')
      .description('Compile workflow')
      .action((workflowId) => {
        console.log(`Workflow "${workflowId}" will be compiled!`)
        // console.log('\x1b[36m', 'workflow', workflow, '\x1b[0m')

        const wf = this.wflib.getWorkflow(workflowId)
        console.log('\x1b[36m', 'wf', JSON.stringify(wf, null, 2), '\x1b[0m')

        const params = {
          // "model": "flux1-dev-fp8.safetensors",
          // "model2": "pulid_flux_v0.9.1.safetensors",
          // "generationNumber": 1,
          // "image": "some.jpg",
          // "filenamePrefix": "flux-pulid",
          // "width": 1024,
          // "height": 1024,
          // "positivePrompt": "green-purple cupcake with big eyes",
          // "sampler": "euler",
          // "scheduler": "normal",
        }

        const compiledWorkflowSchema = this.wflib.compileWorkflow({ id: workflowId, params })
        console.log('\x1b[36m', 'compiledWorkflowSchema', JSON.stringify(compiledWorkflowSchema), '\x1b[0m')

        // console.log('\x1b[36m', 'compiledWorkflowSchema', JSON.stringify(compiledWorkflowSchema, null, 4), '\x1b[0m')

        // const compiledParams = this.wflib.compileWorkflowParams({ id: workflowId, params })
        // console.log('\x1b[36m', 'compiledParams', compiledParams, '\x1b[0m')
        // const compiledWf = this.wflib.compileWorkflowSchema({ id: workflowId, params: compiledParams })
        // console.log('\x1b[36m', 'compiledWf', JSON.stringify(compiledWf, null, 2), '\x1b[0m')

        // const compiledWorkflow = this.wflib.compileWorkflow({
        //   workflowId: 'gen-sd1.5-juggernaut-reborn-0',
        //   // workflowParams,
        // })
        //
        // console.log('\x1b[36m', 'compiledWorkflow', JSON.stringify(compiledWorkflow, null, 4), '\x1b[0m')
      })
  }
}
