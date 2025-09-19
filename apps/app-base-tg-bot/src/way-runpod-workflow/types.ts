import { Context } from 'telegraf'

export interface RunpodWfContext extends Context {
  session: SessionData
}

export interface RunpodWfMatchContext extends RunpodWfContext {
  match: RegExpMatchArray
}

export interface SessionData {
  chatId: number
  step: string
  way?: string
  workflowId?: string
  workflowParams: Record<string, string | number | boolean>
  inputWaiting?: string
}
