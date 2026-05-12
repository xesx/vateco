import { Injectable } from '@nestjs/common'

@Injectable()
export class FormatHelperLibService {
  /**
   * Очищает строку для безопасного сохранения в качестве JSON-значения.
   * Удаляет/экранирует управляющие символы, некорректные escape-последовательности,
   * непарные суррогатные пары и лишние нулевые байты.
   */
  sanitizeJsonString (value: string): string {
    return value
      // Удаляем null-байты и другие управляющие символы (U+0000–U+001F, U+007F),
      // кроме допустимых в JSON: \t (U+0009), \n (U+000A), \r (U+000D)
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      // Заменяем непарные суррогаты (U+D800–U+DFFF) на знак замены U+FFFD
      .replace(/[\uD800-\uDFFF]/g, '\uFFFD')
      // Удаляем обратные слэши, которые не являются частью валидной escape-последовательности
      .replace(/\\(?!["/bfnrtu])/g, '')
      .trim()
  }

  duration (seconds: number): string {
    if (seconds === 0) return '0s'

    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    const parts: string[] = []
    if (hrs > 0) parts.push(`${hrs}h`)
    if (mins > 0) parts.push(`${mins}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

    return parts.join(' ')
  }
}