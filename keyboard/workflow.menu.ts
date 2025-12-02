export function workflowsMenu ({ workflows, prefixAction, backAction }): [string, string][][] {
  const keyboard = Object.entries(workflows)
    .map(([, workflow]: [string, any]) => { return [[workflow.name, `${prefixAction}:wfv:${workflow.id}`]]})
    .concat([[['⬅️ Back', backAction]]])

  return keyboard as [string, string][][]
}