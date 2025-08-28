export type TVastAiInstanceStatus = {
  actual_status: string
  public_ipaddr?: string
  jupyter_token?: string
  gpu_name?: string
  start_date?: number
  dph_total?: number
  label?: string
  id?: number
  image_uuid?: string
  ports?: Record<string, Array<{ HostPort: string }>>
}