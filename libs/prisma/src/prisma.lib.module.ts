import { Global, Module } from '@nestjs/common'
import { PrismaLibService } from './prisma.lib.service'

@Global()
@Module({
  providers: [PrismaLibService],
  exports: [PrismaLibService],
})
export class PrismaLibModule {
  constructor() {
  }
}
