import type { EstimateInput, EstimateResult } from './estimate'
import { money } from './estimate'
import { PAINT_OPTIONS } from './pricing'
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

function paintLabel(input: EstimateInput): string {
  return PAINT_OPTIONS.find((p) => p.key === input.paint)?.name ?? input.paint
}

function regionLabel(input: EstimateInput): string {
  return input.region === 'north' ? '北部' : input.region === 'south' ? '南部' : '中部'
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
  const itemRows = result.lines.slice(0, 6).map((line) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: line.label,
        size: 'sm',
        color: '#6E675C',
        flex: 5,
        wrap: true,
      },
      {
        type: 'text',
        text: money(line.amount),
        size: 'sm',
        align: 'end',
        flex: 4,
        weight: 'bold',
      },
    ],
  }))

  return {
    type: 'flex',
    altText: `${contact.brandZh}油漆估價 ${money(result.mid)}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#141210',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: contact.brandZh,
            color: '#C4A574',
            size: 'xs',
            weight: 'bold',
            letterSpacing: '0.12em',
          },
          {
            type: 'text',
            text: '油漆估價結果',
            color: '#F5F0E8',
            size: 'lg',
            weight: 'bold',
            margin: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: money(result.mid),
            size: 'xl',
            weight: 'bold',
            color: '#141210',
          },
          {
            type: 'text',
            text: `參考區間 ${money(result.low)} – ${money(result.high)}`,
            size: 'sm',
            color: '#6E675C',
          },
          {
            type: 'text',
            text: `地坪 ${input.floorPing} 坪 · ${input.includeCeiling ? '牆面＋天花板' : '僅牆面'} · ${paintLabel(input)} · ${regionLabel(input)}`,
            size: 'xs',
            color: '#6E675C',
            wrap: true,
            margin: 'md',
          },
          { type: 'separator', margin: 'md' },
          ...itemRows,
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#141210',
            action: {
              type: 'uri',
              label: '開啟估價計算機',
              uri: miniAppUrl(),
            },
          },
        ],
      },
    },
  }
}

export async function shareQuote(input: EstimateInput, result: EstimateResult): Promise<string> {
  const messages: LineShareMessage[] = [quoteFlex(input, result)]

  if (liffState.canShare) {
    const sent = await liff.shareTargetPicker(messages as Parameters<typeof liff.shareTargetPicker>[0])
    return sent ? '已開啟分享' : '已取消分享'
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
  return '估價內容已複製'
}

export async function sendQuoteToChat(input: EstimateInput, result: EstimateResult): Promise<string> {
  if (!liffState.canSendToChat) {
    throw new Error('請從 LINE 聊天室開啟此小程式，才能傳送到目前對話')
  }
  await liff.sendMessages([quoteFlex(input, result)] as Parameters<typeof liff.sendMessages>[0])
  return '已傳送到目前聊天'
}
