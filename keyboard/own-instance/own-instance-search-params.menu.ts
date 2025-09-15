type TArgs = {
  gpu?: string
  geolocation?: string
  inDataCenterOnly?: string
}

export function ownInstanceSearchParamsMenu({ gpu, geolocation, inDataCenterOnly }: TArgs): [string, string][][] {
  const keyboardDescription = [
    [[`GPU name (${(gpu || 'N/A')})`, 'act:own-i:search-params:gpu']],
    [[`Geolocation (${(geolocation || 'N/A')})`, 'act:own-i:search-params:geolocation']],
    [[`In data center only (${(inDataCenterOnly || 'N/A')})`, 'act:own-i:search-params:inDataCenterOnly']],
    [[`Start search`, 'act:own-i:search-offers']],
    [[`⬅️ Back`, 'act:main-menu']],
  ] as [string, string][][]

  return keyboardDescription
}