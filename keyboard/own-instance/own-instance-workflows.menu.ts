// import { TelegramContext } from '../../types'
import workflow from '@workflow'

export function ownInstanceWorkflowsMenu(): [string, string][][] {
  const keyboard = Object.entries(workflow).map(([key, value]) => {
    return [[key, `act:own-instance:workflow:${key}`]]
  }).concat([[
    ['⬅️ Back', 'act:own-instance:create'],
  ]])

  return keyboard as [string, string][][]
}