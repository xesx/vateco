import workflowInfo from '@workflow'

export function workflowMenu ({ tags, prefixAction, backAction }): [string, string][][] {
  const keyboard = Object.entries(workflowInfo.schema)
    .filter(([, value]) => {
      if (!tags || tags.length === 0) return true
      if (!value.tags) return false

      return tags.some(tag => value.tags.includes(tag))
    })
    .map(([key]) => { return [[key, `${prefixAction}:workflow:${key}`]]})
    .concat([[['⬅️ Back', backAction]]])

  return keyboard as [string, string][][]
}