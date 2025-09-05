import { Injectable } from '@nestjs/common'
import { Command } from 'commander'

import {
  TestCli
} from './command'

@Injectable()
export class AppCliService {
  constructor(
    private readonly test: TestCli,
  ) {}

  async run(argv: string[]) {
    const program = new Command()

    program
      .name('vateco-cli')
      .description('CLI на NestJS')
      .version('1.0.0')

    // регистрируем команды
    this.test.register(program)

    // program
    //   .command('hello <name>')
    //   .description('Сказать привет')
    //   .action((name) => {
    //     console.log(`Привет, ${name}!`)
    //   })

    await program.parseAsync(argv)
  }
}
