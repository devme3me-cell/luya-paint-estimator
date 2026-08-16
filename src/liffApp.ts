import liff from '@line/liff'
import { contact } from './contact'

export type LiffProfile = {
  displayName: string
  userId: string
  pictureUrl?: string
}

export const liffState = {
  ready: false,
  configured: false,
  inClient: false,
  loggedIn: false,
  canShare: false,
  canSendToChat: false,
  profile: null as LiffProfile | null,
  contextType: '',
  liffId: '',
  error: '',
}

export async function bootLiff(): Promise<void> {
  const liffId = import.meta.env.VITE_LIFF_ID?.trim() ?? ''
  liffState.liffId = liffId

  if (!liffId) {
    liffState.ready = true
    return
  }

  try {
    await liff.init({
      liffId,
      withLoginOnExternalBrowser: false,
    })
    liffState.configured = true
    liffState.inClient = liff.isInClient()
    liffState.loggedIn = liff.isLoggedIn()

    if (liff.isInClient() && !liff.isLoggedIn()) {
      liff.login()
      return
    }

    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile()
      liffState.profile = {
        displayName: profile.displayName,
        userId: profile.userId,
        pictureUrl: profile.pictureUrl,
      }
    }

    const context = liff.getContext()
    liffState.contextType = context?.type ?? ''
    liffState.canShare = liff.isLoggedIn() && liff.isApiAvailable('shareTargetPicker')
    liffState.canSendToChat =
      liff.isInClient() &&
      liff.isLoggedIn() &&
      ['utou', 'group', 'room', 'square_chat'].includes(liffState.contextType)
  } catch (err) {
    liffState.error = err instanceof Error ? err.message : String(err)
  } finally {
    liffState.ready = true
  }
}

export function miniAppUrl(): string {
  if (liffState.liffId) return `https://miniapp.line.me/${liffState.liffId}`
  return window.location.href.split('#')[0]
}

export async function openOfficialLine(): Promise<void> {
  if (liffState.inClient) {
    liff.openWindow({ url: contact.lineUrl, external: false })
    return
  }
  window.open(contact.lineUrl, '_blank', 'noopener,noreferrer')
}

export function closeMiniApp(): void {
  if (liffState.inClient) {
    liff.closeWindow()
    return
  }
  window.history.back()
}

export { liff }
