// import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
// import { firstValueFrom } from 'rxjs'

@Injectable()
export class VastService {
  private readonly baseUrl = 'https://api.vast.ai/v0'
  // private readonly apiKey = process.env.VAST_API_KEY

  // constructor(private readonly http: HttpService) {}

  test() {
    return 'test vast ai response'
  }

  // private get headers() {
  //   return {
  //     Authorization: `Bearer ${this.apiKey}`,
  //     'Content-Type': 'application/json',
  //   }
  // }

  // async listInstances() {
  //   const response = await firstValueFrom(
  //     this.http.get(`${this.baseUrl}/instances`, { headers: this.headers }),
  //   )
  //   return response.data
  // }

  // async createInstance(payload: any) {
  //   const response = await firstValueFrom(
  //     this.http.post(`${this.baseUrl}/instances`, payload, { headers: this.headers }),
  //   )
  //   return response.data
  // }
}
