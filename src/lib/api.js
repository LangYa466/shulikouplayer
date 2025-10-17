const DEFAULT_BASE = import.meta.env.DEV ? '/mir6' : 'https://api.mir6.com'

export async function parseBilibili(url) {
  const endpoint = `${DEFAULT_BASE}/api/bzjiexi?url=${encodeURIComponent(url)}&type=json`
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`网络错误: ${res.status}`)
  }
  return await res.json()
}

