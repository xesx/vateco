export function ownInstanceManageMenu(step?: string): [string, string][][] {
  const keyboardDescription = [
    [[`Check instance status`, 'act:own-i:status']],
    [[`Destroy instance`, 'act:own-i:destroy']],
  ] as [string, string][][]

  if (step === 'running') {
    keyboardDescription.push([[`Select workflow`, 'act:own-i:workflow']])
  }

  return keyboardDescription
}