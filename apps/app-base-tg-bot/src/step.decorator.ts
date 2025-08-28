import { TelegramContext } from './types'

export function Step(...allowedSteps: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = function (ctx: TelegramContext, ...args: any[]) {
      const currentStep = ctx.session.step || '__undefined__'

      if (!allowedSteps.includes(currentStep)) {
        console.log(`Шаг ${currentStep} не разрешен для ${propertyName}. Разрешенные: ${allowedSteps.join(', ')}`)
        ctx.reply(`⚠️ Эта команда недоступна на текущем шаге (${currentStep}).`)
        return
      }

      return method.call(this, ctx, ...args)
    }

    return descriptor
  }
}