// 文件选择工具类
// 用于处理微信小程序的文件选择问题

/**
 * 选择聊天文件
 * 提供多种策略来应对不同情况
 */
export const filePicker = {
  /**
   * 策略 1: 标准 API（带格式限制）
   */
  async chooseWithExtension() {
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['.xlsx', '.xls'],
        success: resolve,
        fail: reject
      })
    })
    // #endif
  },

  /**
   * 策略 2: 无格式限制（手动过滤）
   */
  async chooseWithoutExtension() {
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        success: resolve,
        fail: reject
      })
    })
    // #endif
  },

  /**
   * 策略 3: 使用 uni API
   */
  async chooseWithUni() {
    return new Promise((resolve, reject) => {
      uni.chooseMessageFile({
        count: 1,
        type: 'file',
        success: resolve,
        fail: reject
      })
    })
  },

  /**
   * 智能选择（依次尝试不同策略）
   */
  async smartChoose() {
    const strategies = [
      { name: '标准API（带格式限制）', fn: this.chooseWithExtension },
      { name: '无格式限制', fn: this.chooseWithoutExtension },
      { name: 'Uni API', fn: this.chooseWithUni }
    ]

    for (const strategy of strategies) {
      try {
        console.log(`尝试策略: ${strategy.name}`)
        const result = await strategy.fn.call(this)

        // 验证文件格式
        const file = result.tempFiles[0]
        if (!this.isValidExcel(file.name)) {
          throw new Error('文件格式错误')
        }

        console.log(`✅ 策略成功: ${strategy.name}`)
        return result
      } catch (e) {
        console.log(`❌ 策略失败: ${strategy.name}`, e.message || e.errMsg)

        // 如果是用户取消，直接抛出
        if (e.errMsg && e.errMsg.includes('cancel')) {
          throw e
        }

        // 继续尝试下一个策略
      }
    }

    throw new Error('所有策略都失败了')
  },

  /**
   * 验证是否为有效的 Excel 文件
   */
  isValidExcel(fileName) {
    const name = fileName.toLowerCase()
    return name.endsWith('.xlsx') || name.endsWith('.xls')
  },

  /**
   * 获取文件信息
   */
  getFileInfo(file) {
    return {
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type || '未知',
      path: file.path,
      isExcel: this.isValidExcel(file.name)
    }
  }
}
