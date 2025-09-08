// import * as assert from 'node:assert/strict'

import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'

@Injectable()
export class ErrorHelperLibService {
  parseAxiosError(error: any): any {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return `Error response data: ${JSON.stringify(error.response.data)}, status: ${error.response.status}, headers: ${JSON.stringify(error.response.headers)}`
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      return `Error request: ${error.request}`
    } else if (error.isAxiosError) {
      // Axios error without response (e.g., network error)
      return `Axios error message: ${error.message}`
    } else if (error.message) {
      return `Error message: ${error.message}`
    }

    // Something happened in setting up the request that triggered an Error
    return error
  }
}
