import { Logger } from '@nestjs/common'

const runningJobs = new Map<string, boolean>()
const logger = new Logger('MutexDecorator')

export function Mutex(jobName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const mutexKey = jobName || `${target.constructor.name}.${propertyName}`

    descriptor.value = async function (...args: any[]) {
      if (runningJobs.get(mutexKey)) {
        logger.warn(`⚠️ Job "${mutexKey}" is still running, skipping...`)
        return
      }

      runningJobs.set(mutexKey, true)
      try {
        return await method.apply(this, args)
      } catch (error) {
        logger.error(`Error in job "${mutexKey}":`, error)
        throw error
      } finally {
        runningJobs.set(mutexKey, false)
      }
    }

    return descriptor
  }
}