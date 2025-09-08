import { Module, OnModuleInit } from '@nestjs/common'
import Handlebars from 'handlebars'

import { MessageLibService } from './message.lib.service'

@Module({
  providers: [MessageLibService],
  exports: [MessageLibService],
})
export class MessagesLibModule implements OnModuleInit {
  onModuleInit() {
    Handlebars.registerHelper('progressBar', function (current: number, total: number) {
      if (!total || total <= 0) return '[------------------------------] 0%'

      const percentage = (current / total) * 100
      const filled = '+'.repeat(Math.floor((percentage / 100) * 30))
      const empty = '·'.repeat(30 - filled.length)

      return `[${filled}${empty}] ${Math.round(percentage)}%`
    })

    Handlebars.registerHelper('formatBytes', (bytes: number, decimals = 2) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))
      return `${value} ${sizes[i]}`
    })

    Handlebars.registerHelper('formatDuration', (seconds: number = 0) => {
      if (seconds === 0) return '0s'

      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)

      const parts: string[] = []
      if (hrs > 0) parts.push(`${hrs}h`)
      if (mins > 0) parts.push(`${mins}m`)
      if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

      return parts.join(' ')
    })


    // Можно добавлять и другие хелперы
    Handlebars.registerHelper('formatMb', (bytes: number) =>
      (bytes / 1024 / 1024).toFixed(1) + ' MB',
    )
  }
}
