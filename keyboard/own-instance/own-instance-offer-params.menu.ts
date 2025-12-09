type TArgs = {
  gpu?: string
  geolocation?: string
  inDataCenterOnly?: string
}

export function ownInstanceOfferParamsMenu({ gpu, geolocation, inDataCenterOnly }: TArgs): [string, string][][] {
  const keyboardDescription = [
    [[`GPU name (${(gpu || 'N/A')})`, 'offer:param:gpu']],
    [[`Geolocation (${(geolocation || 'N/A')})`, 'offer:param:geolocation']],
    [[`In data center only (${(inDataCenterOnly || 'N/A')})`, 'offer:param:inDataCenterOnly']],
    [[`Start search`, 'offer:search']],
    [[`⬅️ Back`, 'main-menu']],
  ] as [string, string][][]

  return keyboardDescription
}