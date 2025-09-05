import { Injectable } from '@nestjs/common'

@Injectable()
export class TestCli {
  register(program) {
    program
      .command('test <name>')
      .description('Сказать привет')
      .action((name) => {
        console.log(`Привет, ${name}!`)
      })
  }
}
