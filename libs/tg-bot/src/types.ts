import { InlineKeyboardMarkup } from 'telegraf/types'
import { Markup } from 'telegraf'

export type TSendInlineKeyboardArgs = {
  chatId: string
  text: string
  keyboard: Markup.Markup<InlineKeyboardMarkup>
}