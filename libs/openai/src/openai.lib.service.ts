import { setTimeout } from 'timers/promises'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import OpenAI from 'openai'

@Injectable()
export class OpenaiLibService {
  readonly openai

  constructor(
    private readonly configService: ConfigService
  ) {
    const OPENAI_API_KEY = this.configService.get<string>('OPENAI_API_KEY') || process.env.OPENAI_API_KEY

    this.openai = new OpenAI({ apiKey: OPENAI_API_KEY })
  }

  async assistantRequest ({ assistantId, prompt }) {
    const { openai } = this

    // 1. Создаём thread
    const thread = await openai.beta.threads.create()

    // 2. Добавляем сообщение пользователя
    await openai.beta.threads.messages.create(thread.id, { role: 'user', content: prompt })

    // 3. Запускаем ассистента
    const run = await openai.beta.threads.runs.create(thread.id, {
      'assistant_id': assistantId,
    })

    // 4. Ждём завершения
    let status

    do {
      await setTimeout(1000)

      const updatedRun = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id })

      status = updatedRun.status
    } while (status === 'queued' || status === 'in_progress')

    if (status !== 'completed') {
      throw new Error(`Assistant run failed: ${status}`)
    }

    // 5. Получаем ответ
    const messages = await openai.beta.threads.messages.list(thread.id)
    const last = messages.data.find(m => m.role === 'assistant')

    return last.content[0].text.value
  }

  async improveImagePrompt ({ prompt, modelHint }) {
    const { openai } = this

    // 1. Создаём thread
    const thread = await openai.beta.threads.create()

    // 2. Формируем сообщение
    let content = prompt

    if (modelHint) {
      content += `\n\nTarget model: ${modelHint}`
    }

    // 3. Добавляем сообщение пользователя
    await openai.beta.threads.messages.create(thread.id, { role: 'user', content })

    // 4. Запускаем ассистента
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: 'asst_elp515mB7xkswFqIuohvR9Mj',
    })

    // 5. Ждём завершения
    let status

    do {
      await setTimeout(1000)

      const updatedRun = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id })

      status = updatedRun.status
    } while (status === 'queued' || status === 'in_progress')

    if (status !== 'completed') {
      throw new Error(`Assistant run failed: ${status}`)
    }

    // 6. Получаем ответ
    const messages = await openai.beta.threads.messages.list(thread.id)
    const last = messages.data.find(m => m.role === 'assistant')

    return last.content[0].text.value
  }
}
