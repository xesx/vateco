import { TelegramContext } from '../../types'

export function ownInstanceSearchParamsMenu(ctx: TelegramContext): [string, string][][] {
  const keyboardDescription = [
    [[`GPU name (${ctx.session.gpuName})`, 'act:own-instance:search-params:gpu']],
    [[`Geolocation (${ctx.session.geolocation})`, 'act:own-instance:search-params:geolocation']],
    [[`In data center only (${ctx.session.inDataCenterOnly})`, 'act:own-instance:search-params:in-data-center-only']],
    [[`Start search`, 'act:own-instance:search-params:start-search']],
  ] as [string, string][][]

  if (ctx.session.offerId) {
    keyboardDescription.push([[`Create instance`, 'act:own-instance:create']])
  }

  return keyboardDescription
}