export function ownInstanceCreateMenu(offerId): [string, string][][] {
  const keyboardDescription = [
    [[`🛠️ Create instance (${offerId})`, `instance:create:${offerId}`]],
    [[`⬅️ Back`, 'offer:menu']],
  ] as [string, string][][]

  return keyboardDescription
}