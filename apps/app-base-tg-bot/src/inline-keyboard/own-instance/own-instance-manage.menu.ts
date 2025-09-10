import { TelegramContext } from '../../types'

export function ownInstanceManageMenu(ctx: TelegramContext): [string, string][][] {
  const keyboardDescription = [
    [[`Check instance status`, 'act:own-instance:status']],
    [[`Destroy instance`, 'act:own-instance:destroy']],
  ] as [string, string][][]

  if (ctx.session.step === 'running') {
    keyboardDescription.push([[`Select workflow`, 'action:workflow:select']])
  }

  if (ctx.session.step === 'loading-workflow') {
    keyboardDescription.push([[`Workflow status`, 'action:workflow:status']])
  }

  return keyboardDescription
}