import { Injectable } from '@nestjs/common'
import { Command } from 'commander'

import {
  TestCli,
  InstallComfyuiV0Cli,
} from './command'

@Injectable()
export class AppCliService {
  constructor(
    private readonly test: TestCli,
    private readonly installComfyuiV0: InstallComfyuiV0Cli,
  ) {}

  async run(argv: string[]) {
    const program = new Command()

    program
      .name('vateco-cli')
      .description('CLI на NestJS')
      .version('1.0.0')

    // регистрируем команды
    this.test.register(program)
    this.installComfyuiV0.register(program)

    // program
    //   .command('hello <name>')
    //   .description('Сказать привет')
    //   .action((name) => {
    //     console.log(`Привет, ${name}!`)
    //   })

    await program.parseAsync(argv)
  }
}
