import workflowInfo from '@workflow'

type TArgs = {
  workflowId: string
  workflowParams: {
    [key: string]: string | number | boolean
  }
  backAction: string
  prefixAction: string
}

export function workflowRunMenu({ workflowId, workflowParams, prefixAction, backAction }: TArgs): [string, string][][] {
  const wfExtraParams = workflowInfo.schema[workflowId]?.params

  const keyboard = Object.entries(workflowParams)
    .filter(([name]) => {
      if (wfExtraParams[name].user) {
        return this
      }
    })
    .map(([name, value]) => {
      // truncate value if too long
      value = String(value).length > 15 ? String(value).slice(0, 13) + '...' : String(value)

      return [[wfExtraParams[name].label + `(${value})`, `${prefixAction}:workflow:${workflowId}:param:${name}`]]
    })
    .concat([[
      ['⬅️ Back', backAction],
      ['🚀 Generate', `${prefixAction}:workflow:${workflowId}:run`],
    ]])

  return keyboard as [string, string][][]
}