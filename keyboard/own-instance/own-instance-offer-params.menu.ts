type TArgs = {
  gpu?: string
  geolocation?: string
  inDataCenterOnly?: string
}

export function ownInstanceOfferParamsMenu({ gpu, geolocation, inDataCenterOnly }: TArgs): [string, string][][] {
  const keyboardDescription = [
    [[`GPU name (${(gpu || 'N/A')})`, 'act:own-i:offer:params:gpu']],
    [[`Geolocation (${(geolocation || 'N/A')})`, 'act:own-i:offer:params:geolocation']],
    [[`In data center only (${(inDataCenterOnly || 'N/A')})`, 'act:own-i:offer:params:inDataCenterOnly']],
    [[`Start search`, 'act:own-i:offer:search']],
    [[`⬅️ Back`, 'main-menu']],
  ] as [string, string][][]

  return keyboardDescription
}