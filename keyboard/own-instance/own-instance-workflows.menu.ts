import workflowInfo from '@workflow'

export function ownInstanceWorkflowSelectMenu (): [string, string][][] {
  const keyboard = Object.entries(workflowInfo.schema)
    .filter(([, value]) => value.tags.includes('own-instance'))
    .map(([key]) => [[key, `act:own-i:workflow:${key}`]])
    .concat([[['⬅️ Back', 'act:own-i:manage']]])

  return keyboard as [string, string][][]
}