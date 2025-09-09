// import { TelegramContext } from '../../types'

export function ownInstanceOffersMenu(offers: any[]): [string, string][][] {
  const keyboard = offers.map(o => {
    return [
      [
        `${o?.num_gpus}x ${o.gpu_name}`,
        (o.geolocation?.split(',')?.[1] || o.geolocation || 'N/A')?.trim?.(),
        o.dph_total.toFixed(2) + '$',
        `cuda ${o.cuda_max_good} `,
        `[${o.reliability2?.toFixed?.(2)}]`
      ].join(' '),
      `action:search:offers:select:${o.id}`
    ]
  }).concat([
    ['🔄 Refresh', 'action:search:offers'],
    ['⬅️ Back', 'action:search:params']
  ])

  return keyboard
}