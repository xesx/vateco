import { GEOLOCATION } from '../../const'

function mapper (geoKey: string) {
  let description = geoKey

  if (GEOLOCATION[geoKey]) {
    description = GEOLOCATION[geoKey].flag
  }

  return [description, `act:own-instance:search-params:geolocation:${geoKey}`]
}

export const OWN_INSTANCE_GEOLOCATION_MENU = [
  [mapper('any')],
  [mapper('europe')],
  ['RU', 'SE', 'GB', 'PL', 'PT', 'SI', 'DE', 'IT'].map(mapper),
  ['LT', 'GR', 'FI', 'IS', 'AT', 'FR', 'RO', 'MD'].map(mapper),
  ['HU', 'NO', 'MK', 'BG', 'ES'].map(mapper),
  ['CH', 'HR', 'NL', 'CZ', 'EE'].map(mapper),

  [mapper('north-america')],
  ['US', 'CA'].map(mapper),

  [mapper('south-america')],
  ['BR', 'AR', 'CL'].map(mapper),

  [mapper('asia')],
  ['CN', 'JP', 'KR', 'ID', 'IN', 'HK', 'MY'].map(mapper),
  ['IL', 'TH', 'QA', 'TR', 'VN'].map(mapper),
  ['TW', 'OM', 'SG', 'AE', 'KZ'].map(mapper),
] as [string, string][][]