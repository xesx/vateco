const constsCompiler = {
  IL_NEGATIVE_PROMPT: 'lowres, (bad), bad anatomy, bad hands, extra digits, multiple views, fewer, extra, missing, text, error, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, artistic error, username, scan',
}


export function CONST (name) {
  return constsCompiler[name]
}