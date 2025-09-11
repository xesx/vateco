type TArgs = {
  gpuName?: string
  geolocation?: string
  inDataCenterOnly?: boolean
}

export function ownInstanceSearchParamsMenu({ gpuName, geolocation, inDataCenterOnly }: TArgs): [string, string][][] {
  const keyboardDescription = [
    [[`GPU name (${(gpuName || 'N/A')})`, 'act:own-instance:search-params:gpu']],
    [[`Geolocation (${(geolocation || 'N/A')})`, 'act:own-instance:search-params:geolocation']],
    [[`In data center only (${(inDataCenterOnly || 'N/A')})`, 'act:own-instance:search-params:in-data-center-only']],
    [[`Start search`, 'act:own-instance:search-offers']],
    [[`⬅️ Back`, 'act:main-menu']],
  ] as [string, string][][]

  // if (ctx.session.offerId) {
  //   keyboardDescription.push([[`Create instance`, 'act:own-instance:create']])
  // }

  return keyboardDescription
}