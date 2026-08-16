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
const LOGO_URL = 'https://devme3me-cell.github.io/luya-paint-estimator/luya-logo.png'

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

function chip(label: string, value: string) {
  return {
    type: 'box',
    layout: 'vertical',
    flex: 1,
    paddingAll: '10px',
    cornerRadius: '10px',
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
    spacing: 'md',
    paddingTop: '10px',
    paddingBottom: '10px',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        width: '3px',
        height: '28px',
        backgroundColor: GOLD,
        cornerRadius: '2px',
        flex: 0,
        contents: [{ type: 'filler' }],
      },
      {
        type: 'text',
        text: label,
        size: 'sm',
        color: MUTED,
        flex: 5,
        wrap: true,
        gravity: 'center',
      },
      {
        type: 'text',
        text: amount,
        size: 'sm',
        align: 'end',
        weight: 'bold',
        color: INK,
        flex: 4,
        gravity: 'center',
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
  const items = result.lines.slice(0, 6)
  const extra = result.lines.length - items.length
  const itemRows: Record<string, unknown>[] = []
  items.forEach((line, index) => {
    itemRows.push(itemRow(line.label, money(line.amount)))
    if (index < items.length - 1 || extra > 0) {
      itemRows.push({
        type: 'separator',
        color: '#E4DDD2',
      })
    }
  })
  if (extra > 0) {
    itemRows.push(itemRow(`其他項目 ×${extra}`, '見計算機'))
  }

  return {
    type: 'flex',
    altText: `${contact.brandZh}｜油漆估價 ${money(result.mid)}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      action: {
        type: 'uri',
        label: '開啟估價',
        uri: miniAppUrl(),
      },
      header: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '18px',
        paddingBottom: '14px',
        background: {
          type: 'linearGradient',
          angle: '135deg',
          startColor: '#1C1916',
          endColor: '#0E0E0E',
        },
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            contents: [
              {
                type: 'image',
                url: LOGO_URL,
                size: '40px',
                aspectRatio: '1:1',
                aspectMode: 'cover',
                flex: 0,
              },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                justifyContent: 'center',
                contents: [
                  {
                    type: 'text',
                    text: contact.brandEn,
                    size: 'xxs',
                    color: GOLD,
                    weight: 'bold',
                    letterSpacing: '0.18em',
                  },
                  {
                    type: 'text',
                    text: contact.brandZh,
                    size: 'lg',
                    color: '#F5F0E8',
                    weight: 'bold',
                    margin: 'xs',
                  },
                ],
              },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            height: '2px',
            width: '42px',
            backgroundColor: GOLD,
            contents: [{ type: 'filler' }],
          },
          {
            type: 'text',
            text: contact.tagline,
            size: 'xxs',
            color: '#B8AFA3',
            margin: 'md',
            wrap: true,
          },
        ],
      },
      hero: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        paddingTop: '8px',
        background: {
          type: 'linearGradient',
          angle: '165deg',
          startColor: '#1A1714',
          endColor: '#0E0E0E',
        },
        contents: [
          {
            type: 'text',
            text: 'PREVIEW QUOTE',
            size: 'xxs',
            color: GOLD,
            weight: 'bold',
            letterSpacing: '0.22em',
          },
          {
            type: 'text',
            text: '預估總價',
            size: 'sm',
            color: '#D9D2C7',
            margin: 'sm',
          },
          {
            type: 'text',
            text: money(result.mid),
            size: 'xxl',
            weight: 'bold',
            color: '#F5F0E8',
            margin: 'xs',
            wrap: true,
          },
          {
            type: 'text',
            text: `參考區間  ${money(result.low)}  –  ${money(result.high)}`,
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
        paddingAll: '18px',
        backgroundColor: CREAM,
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
              chip('地坪', `${input.floorPing} 坪`),
              chip('施作', input.includeCeiling ? '牆面＋天花' : '僅牆面'),
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
              chip('漆種', paintLabel(input)),
              chip('地區／檔位', `${regionLabel(input)} · ${qualityLabel(input.quality)}`),
            ],
          },
          {
            type: 'text',
            text: `施作約 ${workPing(input)} 坪（依地坪換算）`,
            size: 'xxs',
            color: MUTED,
            wrap: true,
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '費用明細',
                size: 'sm',
                weight: 'bold',
                color: INK,
              },
              ...itemRows,
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'md',
                paddingAll: '12px',
                cornerRadius: '10px',
                backgroundColor: INK,
                contents: [
                  {
                    type: 'text',
                    text: '合計',
                    size: 'sm',
                    color: GOLD,
                    weight: 'bold',
                    flex: 1,
                  },
                  {
                    type: 'text',
                    text: money(result.subtotal),
                    size: 'md',
                    color: '#F5F0E8',
                    weight: 'bold',
                    align: 'end',
                    flex: 2,
                    wrap: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'text',
            text: '實際報價需現場丈量與牆況評估後確認。',
            size: 'xxs',
            color: MUTED,
            wrap: true,
            margin: 'sm',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '14px',
        backgroundColor: '#0E0E0E',
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
            style: 'secondary',
            height: 'sm',
            color: '#2A2622',
            action: {
              type: 'uri',
              label: '聯繫祿亞空間',
              uri: contact.lineUrl,
            },
          },
          {
            type: 'text',
            text: 'Powered by Nestify',
            size: 'xxs',
            color: '#6E675C',
            align: 'center',
            margin: 'md',
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
