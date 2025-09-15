import workflow from '@workflow'

export function ownInstanceWorkflowSelectMenu(): [string, string][][] {
  const keyboard = Object.entries(workflow).map(([key, value]) => {
    return [[key, `act:own-i:workflow:${key}`]]
  }).concat([[
    ['⬅️ Back', 'act:own-i:manage'],
  ]])

  return keyboard as [string, string][][]
}