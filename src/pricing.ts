/** 2026 台灣油漆連工帶料行情（牆面施作坪） */

export type PaintKey = 'cement' | 'latex' | 'latexImport' | 'special'
export type Quality = 'economy' | 'standard' | 'premium'
export type Region = 'central' | 'north' | 'south'

export interface PaintOption {
  key: PaintKey
  name: string
  method: string
  desc: string
  /** 每坪含工帶料 NT$ */
  min: number
  max: number
}

export const PAINT_OPTIONS: PaintOption[] = [
  {
    key: 'cement',
    name: '水泥漆',
    method: '一底二度',
    desc: '預算有限、租屋或短期翻新',
    min: 500,
    max: 800,
  },
  {
    key: 'latex',
    name: '乳膠漆（國產）',
    method: '一底二度～二底三度',
    desc: '自住首選，耐擦洗、選擇多',
    min: 800,
    max: 1500,
  },
  {
    key: 'latexImport',
    name: '乳膠漆（進口／高階）',
    method: '二底三度',
    desc: '色準與質感要求較高',
    min: 1200,
    max: 2500,
  },
  {
    key: 'special',
    name: '特殊塗料',
    method: '依工法',
    desc: '藝術漆、礦物漆、珪藻土等',
    min: 3000,
    max: 8000,
  },
]

/** 地坪 → 施作牆面／含天花板倍率 */
export const AREA_FACTOR = {
  wallsOnly: 2.7,
  wallsAndCeiling: 3.7,
} as const

export const ADDONS = {
  putty: { min: 300, max: 450, label: '批土＋研磨' },
  ceilingSurcharge: { min: 100, max: 300, label: '天花板加價' },
  moldSpot: { min: 1500, max: 5000, label: '壁癌處理（每處）' },
  protection: { min: 2000, max: 5000, label: '保護工程＋清潔' },
  door: { min: 800, max: 1500, label: '門片上漆（每扇）' },
  minJob: { min: 8000, max: 15000, label: '小面積基本開工費' },
} as const

/** 地區人力調整（相對中部基準） */
export const REGION_FACTOR: Record<Region, number> = {
  central: 1,
  north: 1.12,
  south: 0.95,
}

export const QUALITY_WEIGHT: Record<Quality, number> = {
  economy: 0.15,
  standard: 0.5,
  premium: 0.85,
}

export function pickInRange(min: number, max: number, quality: Quality): number {
  const t = QUALITY_WEIGHT[quality]
  return Math.round(min + (max - min) * t)
}

export const MARKET_NOTE =
  '行情整理自 2026 年公開資料（牆面施作坪、連工帶料）。實際費用依品牌、道數與牆況而定。'
