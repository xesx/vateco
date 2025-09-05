import { Injectable } from '@nestjs/common'
import { Command } from 'commander'

@Injectable()
export class AppCliService {
  async run(argv: string[]) {
    const program = new Command()

    program
      .name('vateco-cli')
      .description('CLI на NestJS')
      .version('1.0.0')

    program
      .command('hello <name>')
      .description('Сказать привет')
      .action((name) => {
        console.log(`Привет, ${name}!`)
      })

    await program.parseAsync(argv)
  }
}
