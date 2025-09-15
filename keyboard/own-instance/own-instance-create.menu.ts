export function ownInstanceCreateMenu(offerId): [string, string][][] {
  const keyboardDescription = [
    [[`🛠️ Create instance (${offerId})`, 'act:own-i:create']],
    [[`⬅️ Back`, 'act:own-i']],
  ] as [string, string][][]

  return keyboardDescription
}