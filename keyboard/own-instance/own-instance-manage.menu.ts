export function ownInstanceManageMenu(step?: string): [string, string][][] {
  const keyboardDescription = [
    [[`Check instance status`, 'act:own-instance:status']],
    [[`Destroy instance`, 'act:own-instance:destroy']],
  ] as [string, string][][]

  if (step === 'running') {
    keyboardDescription.push([[`Select workflow`, 'act:own-instance:workflow']])
  }

  return keyboardDescription
}