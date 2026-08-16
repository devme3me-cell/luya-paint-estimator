import type { EstimateInput, EstimateResult } from './estimate'
import { money } from './estimate'
import { AREA_FACTOR, PAINT_OPTIONS, type Quality } from './pricing'
import { contact } from './contact'
import { liff, liffState, miniAppUrl } from './liffApp'

type FlexMessage = {
  type: 'flex'
  altText: string
  contents: Record<string, unknown>
}

type TextMessage = {
  type: 'text'
  text: string
}

export type LineShareMessage = FlexMessage | TextMessage

const GOLD = '#C4A574'
const GOLD_DEEP = '#A68552'
const INK = '#141210'
const CREAM = '#F7F3EC'
const STONE = '#EFE8DC'
const MUTED = '#8A8174'

function paintLabel(input: EstimateInput): string {
  return PAINT_OPTIONS.find((p) => p.key === input.paint)?.name ?? input.paint
}

function regionLabel(input: EstimateInput): string {
  return input.region === 'north' ? '北部' : input.region === 'south' ? '南部' : '中部'
}

function qualityLabel(quality: Quality): string {
  if (quality === 'economy') return '經濟'
  if (quality === 'premium') return '精緻'
  return '標準'
}

function workPing(input: EstimateInput): number {
  const factor = input.includeCeiling ? AREA_FACTOR.wallsAndCeiling : AREA_FACTOR.wallsOnly
  return Math.round(input.floorPing * factor * 10) / 10
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message: unknown }).message)
    if (message) return message
  }
  return String(err)
}

function chip(label: string, value: string) {
  return {
    type: 'box',
    layout: 'vertical',
    flex: 1,
    paddingAll: '10px',
    cornerRadius: '8px',
    backgroundColor: STONE,
    contents: [
      {
        type: 'text',
        text: label,
        size: 'xxs',
        color: GOLD_DEEP,
        weight: 'bold',
      },
      {
        type: 'text',
        text: value,
        size: 'sm',
        weight: 'bold',
        color: INK,
        wrap: true,
        margin: 'xs',
      },
    ],
  }
}

function itemRow(label: string, amount: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    paddingTop: '8px',
    paddingBottom: '8px',
    contents: [
      {
        type: 'text',
        text: label,
        size: 'sm',
        color: MUTED,
        flex: 5,
        wrap: true,
      },
      {
        type: 'text',
        text: amount,
        size: 'sm',
        align: 'end',
        weight: 'bold',
        color: INK,
        flex: 4,
        wrap: true,
      },
    ],
  }
}

export function quoteText(input: EstimateInput, result: EstimateResult): string {
  const lines = result.lines
    .slice(0, 8)
    .map((line) => `・${line.label} ${money(line.amount)}`)
    .join('\n')

  return [
    `【${contact.brandZh} 油漆估價】`,
    `預估總價 ${money(result.mid)}`,
    `參考區間 ${money(result.low)} – ${money(result.high)}`,
    `地坪 ${input.floorPing} 坪｜${input.includeCeiling ? '牆面＋天花板' : '僅牆面'}｜${paintLabel(input)}｜${regionLabel(input)}`,
    lines,
    '',
    `開啟計算機：${miniAppUrl()}`,
    contact.disclaimer,
  ].join('\n')
}

export function quoteFlex(input: EstimateInput, result: EstimateResult): FlexMessage {
  const items = result.lines.slice(0, 5)
  const extra = result.lines.length - items.length
  const itemRows: Record<string, unknown>[] = []

  items.forEach((line, index) => {
    itemRows.push(itemRow(line.label, money(line.amount)))
    if (index < items.length - 1 || extra > 0) {
      itemRows.push({ type: 'separator', color: '#E4DDD2' })
    }
  })
  if (extra > 0) {
    itemRows.push(itemRow(`其他項目 x${extra}`, '見計算機'))
  }

  return {
    type: 'flex',
    altText: `${contact.brandZh} 油漆估價 ${money(result.mid)}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        backgroundColor: INK,
        contents: [
          {
            type: 'text',
            text: 'LUYA SPACE',
            size: 'xs',
            color: GOLD,
            weight: 'bold',
          },
          {
            type: 'text',
            text: '祿亞空間',
            size: 'xl',
            color: '#F5F0E8',
            weight: 'bold',
            margin: 'md',
          },
          {
            type: 'text',
            text: '油漆估價結果',
            size: 'sm',
            color: '#D9D2C7',
            margin: 'xs',
          },
          {
            type: 'separator',
            color: GOLD,
            margin: 'lg',
          },
          {
            type: 'text',
            text: '預估總價',
            size: 'xs',
            color: GOLD,
            margin: 'lg',
          },
          {
            type: 'text',
            text: money(result.mid),
            size: 'xl',
            weight: 'bold',
            color: '#F5F0E8',
            margin: 'sm',
            wrap: true,
          },
          {
            type: 'text',
            text: `參考區間 ${money(result.low)} - ${money(result.high)}`,
            size: 'xs',
            color: GOLD,
            margin: 'sm',
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        backgroundColor: CREAM,
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
              chip('地坪', `${input.floorPing} 坪`),
              chip('施作', input.includeCeiling ? '牆面+天花' : '僅牆面'),
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
              chip('漆種', paintLabel(input)),
              chip('地區', `${regionLabel(input)} ${qualityLabel(input.quality)}`),
            ],
          },
          {
            type: 'text',
            text: `施作約 ${workPing(input)} 坪`,
            size: 'xxs',
            color: MUTED,
            wrap: true,
          },
          {
            type: 'text',
            text: '費用明細',
            size: 'sm',
            weight: 'bold',
            color: INK,
            margin: 'md',
          },
          ...itemRows,
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'lg',
            paddingAll: '12px',
            cornerRadius: '8px',
            backgroundColor: INK,
            contents: [
              {
                type: 'text',
                text: '合計',
                size: 'sm',
                color: GOLD,
                weight: 'bold',
              },
              {
                type: 'text',
                text: money(result.subtotal),
                size: 'md',
                color: '#F5F0E8',
                weight: 'bold',
                align: 'end',
                wrap: true,
              },
            ],
          },
          {
            type: 'text',
            text: '實際費用需現場丈量後確認',
            size: 'xxs',
            color: MUTED,
            wrap: true,
            margin: 'md',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '12px',
        backgroundColor: INK,
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            color: GOLD,
            action: {
              type: 'uri',
              label: '開啟估價計算機',
              uri: miniAppUrl(),
            },
          },
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'uri',
              label: '聯繫祿亞空間',
              uri: contact.lineUrl,
            },
          },
        ],
      },
    },
  }
}

export async function shareQuote(input: EstimateInput, result: EstimateResult): Promise<string> {
  const flex = quoteFlex(input, result)
  const text: TextMessage = { type: 'text', text: quoteText(input, result) }
  const canPicker = liffState.inClient && liffState.loggedIn

  if (canPicker) {
    if (!liff.isApiAvailable('shareTargetPicker')) {
      throw new Error('請到 LINE Developers Console → LIFF → 開啟 Share target picker')
    }
    try {
      const sent = await liff.shareTargetPicker([flex] as Parameters<typeof liff.shareTargetPicker>[0])
      return sent ? '已開啟分享' : '已取消分享'
    } catch (err) {
      console.error('Flex share failed', err, flex)
      try {
        const sent = await liff.shareTargetPicker([text] as Parameters<typeof liff.shareTargetPicker>[0])
        if (!sent) return '已取消分享'
        return `Flex 無法送出（${errorMessage(err)}），已改傳文字`
      } catch (textErr) {
        throw new Error(`分享失敗：${errorMessage(err)} / ${errorMessage(textErr)}`)
      }
    }
  }

  if (navigator.share) {
    await navigator.share({
      title: `${contact.brandZh}油漆估價`,
      text: quoteText(input, result),
      url: miniAppUrl(),
    })
    return '已分享'
  }

  await navigator.clipboard.writeText(quoteText(input, result))
  return '估價內容已複製。請在 LINE 內開啟小程式才能傳 Flex 卡片。'
}

export async function sendQuoteToChat(input: EstimateInput, result: EstimateResult): Promise<string> {
  if (!liffState.canSendToChat) {
    throw new Error('請從 LINE 聊天室開啟此小程式，才能傳送到目前對話')
  }
  try {
    await liff.sendMessages([quoteFlex(input, result)] as Parameters<typeof liff.sendMessages>[0])
    return '已傳送到目前聊天'
  } catch (err) {
    await liff.sendMessages([
      { type: 'text', text: quoteText(input, result) },
    ] as Parameters<typeof liff.sendMessages>[0])
    return `Flex 無法送出（${errorMessage(err)}），已改傳文字`
  }
}
