export type Lang = 'zh' | 'en'

let current: Lang = 'zh'
const dicts: Record<Lang, Record<string, string>> = { zh: {}, en: {} }
const listeners = new Set<() => void>()

export function t(key: string, params?: Record<string, string | number>): string {
  let s = dicts[current][key] ?? dicts.en[key] ?? key
  if (params) {
    for (const k in params) {
      s = s.split('{' + k + '}').join(String(params[k]))
    }
  }
  return s
}

export function lang(): Lang { return current }

export function setLang(l: Lang): void {
  if (current === l) return
  current = l
  try { localStorage.setItem('webmaster.lang', l) } catch { /* ignore */ }
  listeners.forEach(fn => fn())
}

export function addDict(l: Lang, entries: Record<string, string>): void {
  Object.assign(dicts[l], entries)
}

export function onLangChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

try {
  const saved = localStorage.getItem('webmaster.lang')
  if (saved === 'zh' || saved === 'en') current = saved
} catch { /* ignore */ }
