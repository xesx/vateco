type TArgs = {
  workflowVariantId: number | string
  wfvParams: {
    positionX: number | null
    positionY: number | null
    label: string | null
    value: any
    user: boolean
    paramName: string
  }[]
  backAction: string
  prefixAction: string
}

export function workflowRunMenu ({ workflowVariantId, wfvParams, prefixAction, backAction }: TArgs): [string, string][][] {
  const sortedParams = Object.values(wfvParams)
    .filter(wfvParam => wfvParam.user)
    .sort((wfvParamA, wfvParamB) => {
      const positionA = Number.isInteger(wfvParamA.positionX) ? [wfvParamA.positionX, wfvParamA.positionY ?? undefined] : null
      const positionB = Number.isInteger(wfvParamB.positionX) ? [wfvParamB.positionX, wfvParamB.positionY ?? undefined] : null

      // If both positions are undefined, sort by name
      if (!positionA && !positionB) {
        return wfvParamA.paramName.localeCompare(wfvParamB.paramName)
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
        // @ts-expect-error todo
        return aY - bY
      }

      // @ts-expect-error todo
      return aX - bX
    })

  const keyboard = sortedParams.reduce((acc: [string, string][][], param, i) => {
    const name = param.paramName
    let value = param.value

    if (typeof value === 'boolean' || ['false', 'true'].includes(String(value).toLowerCase())) {
      value = value === true || String(value).toLowerCase() === 'true'
      value = value ? '✅' : '❌'
    }

    if (typeof value === 'object') {
      value = value.label ?? value.value
    }

    value = String(value).length > 15 ? String(value).slice(0, 13) + '...' : String(value)

    const x = param.positionX
    const prevParam = i > 0 ? sortedParams[i - 1] : undefined
    const prevX = prevParam?.positionX

    const action = `${prefixAction}:wf:${workflowVariantId}:param:${name}`
    const label = param.label + `(${value})`

    if (prevX !== undefined && x !== undefined && x === prevX) {
      acc[acc.length - 1].push([label, action])
    } else {
      acc.push([[label, action]])
    }

    return acc
  }, [])
    .concat([[
      ['⬅️ Back', backAction],
      ['🚀 Generate', `${prefixAction}:wf:${workflowVariantId}:run`],
    ]])

  return keyboard as [string, string][][]
}