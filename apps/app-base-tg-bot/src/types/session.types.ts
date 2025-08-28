export interface LocalSessionOptions {
  database?: string
  property?: string
  storage?: any
  format?: {
    serialize: (obj: any) => string
    deserialize: (str: string) => any
  }
}

export interface LocalSessionMiddleware {
  middleware(): any
}

export interface LocalSessionConstructor {
  new (options?: LocalSessionOptions): LocalSessionMiddleware
}
