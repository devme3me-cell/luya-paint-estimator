import './style.css'
import { contact } from './contact'
import { estimate, money, type EstimateInput } from './estimate'
import { MARKET_NOTE, PAINT_OPTIONS, type PaintKey, type Quality, type Region } from './pricing'
import { bootLiff, closeMiniApp, liffState, openOfficialLine } from './liffApp'
import { sendQuoteToChat, shareQuote } from './shareQuote'

const state: EstimateInput = {
  floorPing: 30,
  includeCeiling: true,
  paint: 'latex',
  quality: 'standard',
  region: 'central',
  needPutty: true,
  moldSpots: 0,
  doorCount: 0,
  needProtection: true,
}

let step = 1
let statusMsg = ''

const app = document.querySelector<HTMLDivElement>('#app')!

function lineIcon(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.37 9.87c0-4.03-4.05-7.31-9.03-7.31S1.31 5.84 1.31 9.87c0 3.63 3.22 6.67 7.57 7.23.29.06.7.2.8.45.1.24.06.62.03.86l-.14 1c-.04.22-.21 1.06 1.02.58 1.22-.48 6.59-3.88 9-6.65 1.66-1.84 2.78-3.7 2.78-5.87z"/></svg>`
}

function setStatus(message: string): void {
  statusMsg = message
  const el = document.querySelector('[data-status]')
  if (el) el.textContent = message
}

function render(): void {
  const showingResult = step === 4
  document.body.classList.toggle('in-line', liffState.inClient)

  const hello = liffState.profile
    ? `你好，${liffState.profile.displayName}`
    : liffState.inClient
      ? 'LINE 小程式'
      : '網頁版亦可使用'

  app.innerHTML = `
    <header class="brand-bar">
      <img src="./luya-logo.png" alt="${contact.brandZh} Logo" width="64" height="64" />
      <div class="brand-text">
        <h1>${contact.brandZh}</h1>
        <p>${contact.brandEn} · ${contact.tagline}</p>
        <p class="liff-hello">${hello}</p>
      </div>
      ${
        liffState.inClient
          ? `<button type="button" class="icon-close" data-close aria-label="關閉">關閉</button>`
          : ''
      }
    </header>

    <section class="hero">
      <p class="eyebrow">LINE Mini App · 2026 Paint Quote</p>
      <h2>油漆估價計算機</h2>
      <p class="lead">輸入坪數與漆種，即時估算連工帶料費用。完成後可分享估價，或直接聯繫祿亞空間。</p>
    </section>

    <div class="panel">
      <div class="steps" aria-label="步驟">
        <div class="step-dot ${step === 1 ? 'active' : step > 1 ? 'done' : ''}">1 面積</div>
        <div class="step-dot ${step === 2 ? 'active' : step > 2 ? 'done' : ''}">2 漆種</div>
        <div class="step-dot ${step === 3 ? 'active' : step > 3 ? 'done' : ''}">3 加項</div>
        <div class="step-dot ${step === 4 ? 'active' : ''}">4 結果</div>
      </div>

      <div class="screen ${step === 1 ? 'active' : ''}" data-step="1">
        <div class="field">
          <label for="floorPing">室內地坪坪數</label>
          <div class="input-row">
            <input id="floorPing" type="number" min="1" max="500" step="0.5" inputmode="decimal" value="${state.floorPing}" />
            <span class="unit">坪</span>
          </div>
          <p class="hint">報價以「牆面施作坪」計算。系統會依地坪自動換算（牆面約 ×2.7；含天花板約 ×3.7）。</p>
        </div>

        <div class="field">
          <label>施作範圍</label>
          <div class="choice-grid two">
            ${scopeChoice(true, '牆面＋天花板', '一般全室粉刷')}
            ${scopeChoice(false, '僅牆面', '不含天花板')}
          </div>
        </div>

        <div class="field">
          <label>服務地區</label>
          <div class="choice-grid">
            ${regionChoice('central', '中部（台中基準）', '基準行情')}
            ${regionChoice('north', '北部（雙北等）', '人力約 +10～15%')}
            ${regionChoice('south', '南部', '人力約略低於中部')}
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-primary" data-next>下一步：選漆種</button>
        </div>
      </div>

      <div class="screen ${step === 2 ? 'active' : ''}" data-step="2">
        <div class="field">
          <label>油漆種類</label>
          <div class="choice-grid">
            ${PAINT_OPTIONS.map((p) => paintChoice(p.key, p.name, p.method, `${p.desc}｜行情 NT$${p.min.toLocaleString('zh-TW')}–${p.max.toLocaleString('zh-TW')}/坪`)).join('')}
          </div>
        </div>

        <div class="field">
          <label>品質／預算檔位</label>
          <div class="choice-grid two">
            ${qualityChoice('economy', '經濟', '取行情偏低區間')}
            ${qualityChoice('standard', '標準', '取行情中段（建議）')}
            ${qualityChoice('premium', '精緻', '取行情偏高區間')}
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-ghost" data-prev>上一步</button>
          <button type="button" class="btn btn-primary" data-next>下一步：加項</button>
        </div>
      </div>

      <div class="screen ${step === 3 ? 'active' : ''}" data-step="3">
        <div class="toggle-list">
          <label class="toggle">
            <div>
              <span>批土＋研磨</span>
              <small>舊屋翻新幾乎必做；新成屋可省略</small>
            </div>
            <input type="checkbox" id="needPutty" ${state.needPutty ? 'checked' : ''} />
          </label>
          <label class="toggle">
            <div>
              <span>保護工程＋清潔</span>
              <small>地板養生、遮蔽與完工清潔</small>
            </div>
            <input type="checkbox" id="needProtection" ${state.needProtection ? 'checked' : ''} />
          </label>
          <label class="toggle">
            <div>
              <span>壁癌處理處數</span>
              <small>每處另計修補與防水</small>
            </div>
            <div class="num-inline">
              <input type="number" id="moldSpots" min="0" max="50" inputmode="numeric" value="${state.moldSpots}" />
              <span>處</span>
            </div>
          </label>
          <label class="toggle">
            <div>
              <span>門片上漆</span>
              <small>依材質與尺寸另計</small>
            </div>
            <div class="num-inline">
              <input type="number" id="doorCount" min="0" max="40" inputmode="numeric" value="${state.doorCount}" />
              <span>扇</span>
            </div>
          </label>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-ghost" data-prev>上一步</button>
          <button type="button" class="btn btn-primary" data-calc>產生估價結果</button>
        </div>
      </div>
    </div>

    <section class="results ${showingResult ? 'visible' : ''}" id="results">
      ${showingResult ? renderResults() : ''}
    </section>

    <p class="status-line" data-status>${statusMsg}</p>

    <footer class="site-footer">
      <p class="footer-note">${MARKET_NOTE}</p>
      <p class="footer-credit">
        <span>© ${contact.brandZh}</span>
        <span class="sep" aria-hidden="true">·</span>
        ${
          contact.maker.url
            ? `<a class="nestify" href="${contact.maker.url}" target="_blank" rel="noopener noreferrer">${contact.maker.label} <strong>${contact.maker.name}</strong></a>`
            : `<span class="nestify">${contact.maker.label} <strong>${contact.maker.name}</strong></span>`
        }
      </p>
      <p class="legal-links">
        <a href="./privacy.html">隱私權政策</a>
        <span aria-hidden="true">·</span>
        <a href="./terms.html">使用條款</a>
      </p>
    </footer>
  `

  if (showingResult) {
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function scopeChoice(includeCeiling: boolean, title: string, desc: string): string {
  const checked = state.includeCeiling === includeCeiling
  return `
    <label class="choice">
      <input type="radio" name="scope" value="${includeCeiling}" ${checked ? 'checked' : ''} />
      <span class="choice-body">
        <span class="choice-title">${title}</span>
        <span class="choice-desc">${desc}</span>
      </span>
    </label>
  `
}

function regionChoice(value: Region, title: string, desc: string): string {
  return `
    <label class="choice">
      <input type="radio" name="region" value="${value}" ${state.region === value ? 'checked' : ''} />
      <span class="choice-body">
        <span class="choice-title">${title}</span>
        <span class="choice-desc">${desc}</span>
      </span>
    </label>
  `
}

function paintChoice(key: PaintKey, title: string, meta: string, desc: string): string {
  return `
    <label class="choice">
      <input type="radio" name="paint" value="${key}" ${state.paint === key ? 'checked' : ''} />
      <span class="choice-body">
        <span class="choice-title">${title}</span>
        <span class="choice-meta">${meta}</span>
        <span class="choice-desc">${desc}</span>
      </span>
    </label>
  `
}

function qualityChoice(value: Quality, title: string, desc: string): string {
  return `
    <label class="choice">
      <input type="radio" name="quality" value="${value}" ${state.quality === value ? 'checked' : ''} />
      <span class="choice-body">
        <span class="choice-title">${title}</span>
        <span class="choice-desc">${desc}</span>
      </span>
    </label>
  `
}

function renderResults(): string {
  const result = estimate(state)
  const paintName = PAINT_OPTIONS.find((p) => p.key === state.paint)?.name ?? ''
  const scope = state.includeCeiling ? '牆面＋天花板' : '僅牆面'
  const regionLabel =
    state.region === 'north' ? '北部' : state.region === 'south' ? '南部' : '中部'

  return `
    <div class="result-hero">
      <div class="result-brand">
        <img src="./luya-logo.png" alt="${contact.brandZh}" />
        <div>
          <strong>${contact.brandZh}</strong>
          <span>${contact.brandEn}</span>
        </div>
      </div>
      <p class="result-label">預估總價（參考）</p>
      <p class="result-total">${money(result.mid)}</p>
      <p class="result-range">參考區間 ${money(result.low)} – ${money(result.high)}</p>
      <div class="result-meta">
        <span class="chip">地坪 ${state.floorPing} 坪</span>
        <span class="chip">施作約 ${state.includeCeiling ? round1(state.floorPing * 3.7) : round1(state.floorPing * 2.7)} 坪</span>
        <span class="chip">${paintName}</span>
        <span class="chip">${scope}</span>
        <span class="chip">${regionLabel}</span>
      </div>
    </div>

    <div class="breakdown">
      <h3>費用明細</h3>
      ${result.lines
        .map(
          (line) => `
        <div class="line">
          <div class="name">${line.label}</div>
          <div class="amt">${money(line.amount)}</div>
          <div class="detail">${line.detail}</div>
        </div>
      `,
        )
        .join('')}
      <div class="line total">
        <div class="name">合計（中位估算）</div>
        <div class="amt">${money(result.subtotal)}</div>
      </div>
      <p class="note">${contact.disclaimer}</p>
    </div>

    <div class="contact-card">
      <h3>${contact.brandZh}</h3>
      <p class="sub">${contact.tagline}｜${contact.region}</p>
      <ul class="contact-list">
        <li><span class="k">電話</span><a href="${contact.phoneHref}">${contact.phone}</a></li>
        <li><span class="k">Email</span><a href="mailto:${contact.email}">${contact.email}</a></li>
        <li><span class="k">地址</span><span>${contact.address}</span></li>
        <li><span class="k">時間</span><span>${contact.hours}</span></li>
        <li><span class="k">LINE</span><span>${contact.lineId}</span></li>
      </ul>
      <div class="mini-actions">
        <button type="button" class="btn btn-share" data-share>分享估價</button>
        ${
          liffState.canSendToChat
            ? `<button type="button" class="btn btn-ghost-dark" data-send>傳送到此聊天</button>`
            : ''
        }
        <button type="button" class="btn btn-line" data-consult>
          ${lineIcon()}
          官方 LINE 諮詢報價
        </button>
      </div>
      <div class="actions" style="margin-top:12px">
        <button type="button" class="btn btn-ghost" data-restart style="width:100%;color:#f5f0e8;border-color:rgba(245,240,232,0.2)">重新估算</button>
      </div>
    </div>
  `
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function readForm(): void {
  const floor = document.querySelector<HTMLInputElement>('#floorPing')
  if (floor) state.floorPing = Math.max(0, Number(floor.value) || 0)

  const scope = document.querySelector<HTMLInputElement>('input[name="scope"]:checked')
  if (scope) state.includeCeiling = scope.value === 'true'

  const region = document.querySelector<HTMLInputElement>('input[name="region"]:checked')
  if (region) state.region = region.value as Region

  const paint = document.querySelector<HTMLInputElement>('input[name="paint"]:checked')
  if (paint) state.paint = paint.value as PaintKey

  const quality = document.querySelector<HTMLInputElement>('input[name="quality"]:checked')
  if (quality) state.quality = quality.value as Quality

  const putty = document.querySelector<HTMLInputElement>('#needPutty')
  if (putty) state.needPutty = putty.checked

  const protection = document.querySelector<HTMLInputElement>('#needProtection')
  if (protection) state.needProtection = protection.checked

  const mold = document.querySelector<HTMLInputElement>('#moldSpots')
  if (mold) state.moldSpots = Math.max(0, Math.floor(Number(mold.value) || 0))

  const doors = document.querySelector<HTMLInputElement>('#doorCount')
  if (doors) state.doorCount = Math.max(0, Math.floor(Number(doors.value) || 0))
}

function bind(): void {
  app.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-next],[data-prev],[data-calc],[data-restart],[data-close],[data-consult],[data-share],[data-send]',
    )
    if (!target) return

    if (target.hasAttribute('data-next')) {
      readForm()
      if (step === 1 && state.floorPing <= 0) {
        setStatus('請輸入有效的地坪坪數')
        return
      }
      step = Math.min(4, step + 1)
      render()
      return
    }

    if (target.hasAttribute('data-prev')) {
      readForm()
      step = Math.max(1, step - 1)
      render()
      return
    }

    if (target.hasAttribute('data-calc')) {
      readForm()
      step = 4
      render()
      return
    }

    if (target.hasAttribute('data-restart')) {
      step = 1
      statusMsg = ''
      render()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (target.hasAttribute('data-close')) {
      closeMiniApp()
      return
    }

    if (target.hasAttribute('data-consult')) {
      void openOfficialLine()
      return
    }

    if (target.hasAttribute('data-share')) {
      void shareQuote(state, estimate(state))
        .then(setStatus)
        .catch((err) => setStatus(err instanceof Error ? err.message : '分享失敗'))
      return
    }

    if (target.hasAttribute('data-send')) {
      void sendQuoteToChat(state, estimate(state))
        .then(setStatus)
        .catch((err) => setStatus(err instanceof Error ? err.message : '傳送失敗'))
    }
  })
}

function renderBoot(): void {
  app.innerHTML = `
    <div class="boot">
      <img src="./luya-logo.png" alt="${contact.brandZh}" width="72" height="72" />
      <p class="boot-brand">${contact.brandZh}</p>
      <p class="boot-msg">油漆估價載入中…</p>
    </div>
  `
}

async function start(): Promise<void> {
  bind()
  renderBoot()
  await bootLiff()
  if (liffState.error) statusMsg = `LIFF：${liffState.error}`
  render()
}

void start()
