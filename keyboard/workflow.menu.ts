export function workflowMenu ({ workflows, prefixAction, backAction }): [string, string][][] {
  const keyboard = Object.entries(workflows)
    .map(([key]) => { return [[key, `${prefixAction}:workflow:${key}`]]})
    .concat([[['⬅️ Back', backAction]]])

  return keyboard as [string, string][][]
}