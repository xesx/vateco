import workflow from '@workflow'

export function ownInstanceWorkflowsMenu(): [string, string][][] {
  const keyboard = Object.entries(workflow).map(([key, value]) => {
    return [[key, `act:own-instance:workflow:${key}`]]
  }).concat([[
    ['⬅️ Back', 'act:own-instance:manage'],
  ]])

  return keyboard as [string, string][][]
}