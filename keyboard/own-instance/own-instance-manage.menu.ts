export function ownInstanceManageMenu(): [string, string][][] {
  const keyboardDescription = [
    [[`Check instance status`, 'instance:status']],
    [[`Destroy instance`, 'instance:destroy']],
    [['Select workflow', 'wfv:list']],
  ] as [string, string][][]

  return keyboardDescription
}