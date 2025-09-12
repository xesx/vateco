type TArgs = {
  workflowParams: {
    [key: string]: string | number | boolean
  }
  backAction: string
  prefixAction: string
}

export function workflowRunMenu({ workflowParams, prefixAction, backAction }: TArgs): [string, string][][] {
  const keyboard = Object.entries(workflowParams).map(([name, value]) => {
    // truncate value if too long
    value = String(value).length > 15 ? String(value).slice(0, 13) + '...' : String(value)

    return [[name + `(${value})`, `${prefixAction}:workflow-param:${name}`]]
  }).concat([[
    ['⬅️ Back', backAction],
    ['🚀 Generate', `${prefixAction}:workflow-run`],
  ]])

  return keyboard as [string, string][][]
}