type TArgs = {
  workflowVariantId: number | string
  workflowVariantParams: {
    [key: string]: {
      position: [number, number]
      label: string
      value: any
      user: boolean
    }
  }
  workflowUserParams: {
    [key: string]: any
  }
  backAction: string
  prefixAction: string
}

export function workflowRunMenu ({ workflowVariantId, workflowVariantParams, workflowUserParams, prefixAction, backAction }: TArgs): [string, string][][] {
  const sortedParams = Object.entries(workflowUserParams)
    // .filter(([name]) => !!workflow.params[name])
    .filter(([name]) => workflowVariantParams[name].user)
    .sort(([nameA], [nameB]) => {
      const positionA = workflowVariantParams[nameA].position
      const positionB = workflowVariantParams[nameB].position

      // If both positions are undefined, sort by name
      if (!positionA && !positionB) {
        return nameA.localeCompare(nameB)
      }
      // If only positionA is undefined, it goes after positionB
      if (!positionA) {
        return 1
      }
      // If only positionB is undefined, it goes after positionA
      if (!positionB) {
        return -1
      }

      // Both positions are defined, sort by x first, then by y
      // undefined x or y goes to the end (9000)
      const [aX = 9000, aY = 9000] = positionA ?? []
      const [bX = 9000, bY = 9000] = positionB ?? []

      if (aX === bX) {
        return aY - bY
      }

      return aX - bX
    })

    const keyboard = sortedParams.reduce((acc: [string, string][][], [name, value], i) => {
      if (typeof value === 'boolean' || ['false', 'true'].includes(String(value).toLowerCase())) {
        value = value === true || String(value).toLowerCase() === 'true'
        value = value ? '✅' : '❌'
      }

      if (typeof value === 'object') {
        value = value.label || value.value
      }

      value = String(value).length > 15 ? String(value).slice(0, 13) + '...' : String(value)

      const [x] = workflowVariantParams[name].position || []
      const [prevParamKey] = i > 0 ? sortedParams[i - 1] : []
      const [prevX] = prevParamKey ? (workflowVariantParams[prevParamKey].position || []) : []

      if (prevX !== undefined && x !== undefined && x === prevX) {
        acc[acc.length - 1].push([workflowVariantParams[name].label + `(${value})`, `${prefixAction}:wf:${workflowVariantId}:param:${name}`])
      } else {
        acc.push([[workflowVariantParams[name].label + `(${value})`, `${prefixAction}:wf:${workflowVariantId}:param:${name}`]])
      }

      return acc
    }, [])
    .concat([[
      ['⬅️ Back', backAction],
      ['🚀 Generate', `${prefixAction}:wf:${workflowVariantId}:run`],
    ]])

  return keyboard as [string, string][][]
}