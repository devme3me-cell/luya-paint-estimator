import {
  ADDONS,
  AREA_FACTOR,
  PAINT_OPTIONS,
  REGION_FACTOR,
  pickInRange,
  type PaintKey,
  type Quality,
  type Region,
} from './pricing'

export interface EstimateInput {
  floorPing: number
  includeCeiling: boolean
  paint: PaintKey
  quality: Quality
  region: Region
  needPutty: boolean
  moldSpots: number
  doorCount: number
  needProtection: boolean
}

export interface LineItem {
  label: string
  detail: string
  amount: number
}

export interface EstimateResult {
  wallPing: number
  ceilingPing: number
  paintUnit: number
  lines: LineItem[]
  subtotal: number
  appliedMinJob: boolean
  low: number
  high: number
  mid: number
}

export function estimate(input: EstimateInput): EstimateResult {
  const floor = Math.max(0, input.floorPing)
  const factor = input.includeCeiling ? AREA_FACTOR.wallsAndCeiling : AREA_FACTOR.wallsOnly
  const wallPing = round1(floor * (input.includeCeiling ? AREA_FACTOR.wallsOnly : factor))
  const ceilingPing = input.includeCeiling ? round1(floor) : 0
  const workPing = input.includeCeiling
    ? round1(floor * AREA_FACTOR.wallsAndCeiling)
    : wallPing

  const paintOpt = PAINT_OPTIONS.find((p) => p.key === input.paint)!
  const regionMul = REGION_FACTOR[input.region]
  const paintUnit = Math.round(pickInRange(paintOpt.min, paintOpt.max, input.quality) * regionMul)

  const lines: LineItem[] = []

  const paintArea = input.includeCeiling ? workPing : wallPing
  const paintAmount = Math.round(paintArea * paintUnit)
  lines.push({
    label: `${paintOpt.name}（含工帶料）`,
    detail: `${paintArea} 坪 × NT$${paintUnit.toLocaleString('zh-TW')}（${paintOpt.method}）`,
    amount: paintAmount,
  })

  if (input.includeCeiling) {
    const surcharge = pickInRange(
      ADDONS.ceilingSurcharge.min,
      ADDONS.ceilingSurcharge.max,
      input.quality,
    )
    const amount = Math.round(ceilingPing * surcharge)
    lines.push({
      label: ADDONS.ceilingSurcharge.label,
      detail: `${ceilingPing} 坪 × NT$${surcharge.toLocaleString('zh-TW')}`,
      amount,
    })
  }

  if (input.needPutty) {
    const unit = pickInRange(ADDONS.putty.min, ADDONS.putty.max, input.quality)
    const amount = Math.round(paintArea * unit)
    lines.push({
      label: ADDONS.putty.label,
      detail: `${paintArea} 坪 × NT$${unit.toLocaleString('zh-TW')}`,
      amount,
    })
  }

  if (input.moldSpots > 0) {
    const unit = pickInRange(ADDONS.moldSpot.min, ADDONS.moldSpot.max, input.quality)
    const amount = Math.round(input.moldSpots * unit)
    lines.push({
      label: ADDONS.moldSpot.label,
      detail: `${input.moldSpots} 處 × NT$${unit.toLocaleString('zh-TW')}`,
      amount,
    })
  }

  if (input.doorCount > 0) {
    const unit = pickInRange(ADDONS.door.min, ADDONS.door.max, input.quality)
    const amount = Math.round(input.doorCount * unit)
    lines.push({
      label: ADDONS.door.label,
      detail: `${input.doorCount} 扇 × NT$${unit.toLocaleString('zh-TW')}`,
      amount,
    })
  }

  if (input.needProtection) {
    const amount = pickInRange(ADDONS.protection.min, ADDONS.protection.max, input.quality)
    lines.push({
      label: ADDONS.protection.label,
      detail: '一式',
      amount,
    })
  }

  let subtotal = lines.reduce((s, l) => s + l.amount, 0)
  let appliedMinJob = false
  const minJob = pickInRange(ADDONS.minJob.min, ADDONS.minJob.max, input.quality)
  if (floor > 0 && floor < 10 && subtotal < minJob) {
    lines.push({
      label: ADDONS.minJob.label,
      detail: `小面積案場補足至基本開工費 NT$${minJob.toLocaleString('zh-TW')}`,
      amount: minJob - subtotal,
    })
    subtotal = minJob
    appliedMinJob = true
  }

  // 區間：以品質檔位附近 ±12% 作為參考高低價
  const low = Math.round(subtotal * 0.88)
  const high = Math.round(subtotal * 1.12)

  return {
    wallPing: input.includeCeiling ? round1(floor * AREA_FACTOR.wallsOnly) : wallPing,
    ceilingPing,
    paintUnit,
    lines,
    subtotal,
    appliedMinJob,
    low,
    high,
    mid: subtotal,
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function money(n: number): string {
  return `NT$ ${Math.round(n).toLocaleString('zh-TW')}`
}
