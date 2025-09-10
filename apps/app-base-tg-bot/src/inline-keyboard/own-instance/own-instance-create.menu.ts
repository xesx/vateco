export function ownInstanceCreateMenu(offerId): [string, string][][] {
  const keyboardDescription = [
    [[`Create instance (${offerId})`, 'act:own-instance:create']],
    [[`⬅️ Back`, 'act:own-instance']],
  ] as [string, string][][]

  return keyboardDescription
}