export function workflowsMenu ({ workflows, prefixAction, backAction }): [string, string][][] {
  const keyboard = Object.entries(workflows)
    .map(([, value]: [string, any]) => { return [[value.name, `${prefixAction}:workflow:${value.id}`]]})
    .concat([[['⬅️ Back', backAction]]])

  return keyboard as [string, string][][]
}