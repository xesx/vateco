export type TVastAiInstanceStatus = {
  actual_status: string
  cur_state?: string
  public_ipaddr?: string
  jupyter_token?: string
  gpu_name?: string
  start_date?: number
  dph_total?: number
  label?: string
  id?: number
  duration?: number
  image_uuid?: string
  ports?: Record<string, Array<{ HostPort: string }>>
}