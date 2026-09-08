export const parseTripId = (options) => {
  const rawId = options?.id
  const id = typeof rawId === 'number' ? rawId : Number(rawId)

  return Number.isInteger(id) && id > 0 ? id : null
}

export const requestGroupDetail = ({ request, baseUrl, tripId }) => {
  return new Promise((resolve, reject) => {
    request({
      url: `${baseUrl}/groups/${tripId}`,
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data)
          return
        }

        const message = response.data?.error || `请求失败：${response.statusCode}`
        reject(new Error(message))
      },
      fail: reject
    })
  })
}

export const requestAddMember = ({ request, baseUrl, tripId, member }) => {
  return new Promise((resolve, reject) => {
    request({
      url: `${baseUrl}/groups/${tripId}/members`,
      method: 'POST',
      data: {
        ...member,
        price: Number(member.price) || 0
      },
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data)
          return
        }

        const message = response.data?.error || `请求失败：${response.statusCode}`
        reject(new Error(message))
      },
      fail: reject
    })
  })
}
