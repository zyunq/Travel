export function normalizeAuthResponse(data) {
  const payload = data && typeof data === 'object' ? data : {}
  const token = payload.token || ''
  const user = payload.user && typeof payload.user === 'object'
    ? payload.user
    : null
  return { token, user }
}
