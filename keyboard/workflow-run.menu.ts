type TArgs = {
  workflow: any
  workflowUserParams: {
    [key: string]: string | number | boolean
  }
  backAction: string
  prefixAction: string
}

export function workflowRunMenu ({ workflow, workflowUserParams, prefixAction, backAction }: TArgs): [string, string][][] {
  const keyboard = Object.entries(workflowUserParams)
    .filter(([name]) => !!workflow.params[name])
    .map(([name, value]) => {
      // truncate value if too long
      value = String(value).length > 15 ? String(value).slice(0, 13) + '...' : String(value)

      return [[workflow.params[name].label + `(${value})`, `${prefixAction}:workflow:${workflow.id}:param:${name}`]]
    })
    .concat([[
      ['⬅️ Back', backAction],
      ['🚀 Generate', `${prefixAction}:workflow:${workflow.id}:run`],
    ]])

  return keyboard as [string, string][][]
}