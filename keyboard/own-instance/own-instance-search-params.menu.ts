type TArgs = {
  gpu?: string
  geolocation?: string
  inDataCenterOnly?: string
}

export function ownInstanceSearchParamsMenu({ gpu, geolocation, inDataCenterOnly }: TArgs): [string, string][][] {
  const keyboardDescription = [
    [[`GPU name (${(gpu || 'N/A')})`, 'act:own-instance:search-params:gpu']],
    [[`Geolocation (${(geolocation || 'N/A')})`, 'act:own-instance:search-params:geolocation']],
    [[`In data center only (${(inDataCenterOnly || 'N/A')})`, 'act:own-instance:search-params:inDataCenterOnly']],
    [[`Start search`, 'act:own-instance:search-offers']],
    [[`⬅️ Back`, 'act:main-menu']],
  ] as [string, string][][]

  return keyboardDescription
}