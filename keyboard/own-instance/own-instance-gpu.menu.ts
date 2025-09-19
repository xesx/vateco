function mapper (gpu: string) {
  return [gpu, `act:own-i:offer-params:gpu:${gpu}`]
}

export const OWN_INSTANCE_GPU_MENU = [
  ['RTX 3060', 'RTX 3090'].map(mapper),
  [mapper('RTX 4090')],
  [mapper('RTX 5090')],
] as [string, string][][]