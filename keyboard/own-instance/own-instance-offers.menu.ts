export function ownInstanceOffersMenu(offers: any[]): [string, string][][] {
  const keyboard = offers.map(o => {
    const gpuInfo = `${o?.num_gpus}x ${o.gpu_name}`
    const geolocation = (o.geolocation?.split(',')?.[1] || o.geolocation || 'N/A')?.trim?.()
    const dhp = o.dph_total?.toFixed(2) + '$'
    const cuda = `cuda ${o.cuda_max_good} `
    const reliability2 = o.reliability2?.toFixed(2) || 'N/A'

    const offerDescription = [gpuInfo, geolocation, dhp, cuda, reliability2].join(' ')

    return [[offerDescription, `act:own-i:offer:${o.id}`]]
  }).concat([[
    ['⬅️ Back', 'act:own-i'],
    ['🔄 Refresh', 'act:own-i:search-offers'],
  ]])

  return keyboard as [string, string][][]
}