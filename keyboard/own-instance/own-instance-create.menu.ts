export function ownInstanceCreateMenu(offerId): [string, string][][] {
  const keyboardDescription = [
    [[`🛠️ Create instance (${offerId})`, 'act:own-i:instance:create']],
    [[`⬅️ Back`, 'act:own-i:offer']],
  ] as [string, string][][]

  return keyboardDescription
}