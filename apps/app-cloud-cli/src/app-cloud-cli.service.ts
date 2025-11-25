import { Injectable } from '@nestjs/common'
import { Command } from 'commander'

import * as command from './command'

@Injectable()
export class AppCloudCliService {
  constructor(
    private readonly _cli01: command.TestCli,
    private readonly _cli02: command.InstallComfyuiV0Cli,
    private readonly _cli03: command.StartComfyuiCli,
  ) {}

  async run(argv: string[]) {
    const program = new Command()

    program
      .name('cloud-cli')
      .description('CLI for Cloud App on NestJS')
      .version('1.0.0')

    Object.keys(this).forEach(key => {
      if (key.startsWith('_cli') && typeof this[key]?.register === 'function') {
        this[key].register(program)
      }
    })

    await program.parseAsync(argv)
  }
}
