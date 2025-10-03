export function ownInstanceManageMenu(step?: string): [string, string][][] {
  const keyboardDescription = [
    [[`Check instance status`, 'act:own-i:instance:status']],
    [[`Destroy instance`, 'act:own-i:instance:destroy']],
  ] as [string, string][][]

  if (step === 'running') {
    keyboardDescription.push([[`Select workflow`, 'act:own-i:wf:variants']])
  }

  return keyboardDescription
}