<template>
  <view class="page">
    <view class="container">
      <text class="title">真机文件选择测试</text>

      <!-- 环境信息 -->
      <view class="section info-section">
        <text class="section-title">📱 设备信息</text>
        <view class="info-row">
          <text class="label">设备:</text>
          <text class="value">{{ deviceInfo.platform }}</text>
          <text class="badge" :class="deviceInfo.platform !== 'devtools' ? 'success' : 'warning'">
            {{ deviceInfo.platform !== 'devtools' ? '真机 ✅' : '开发工具 ⚠️' }}
          </text>
        </view>
        <view class="info-row">
          <text class="label">微信版本:</text>
          <text class="value">{{ deviceInfo.version }}</text>
        </view>
        <view class="info-row">
          <text class="label">基础库:</text>
          <text class="value">{{ deviceInfo.SDKVersion }}</text>
          <text class="badge" :class="isBaseLibSupported ? 'success' : 'error'">
            {{ isBaseLibSupported ? '符合要求 ✅' : '版本过低 ❌' }}
          </text>
        </view>
        <view class="info-row">
          <text class="label">API:</text>
          <text class="value">chooseMessageFile</text>
          <text class="badge" :class="hasAPI ? 'success' : 'error'">
            {{ hasAPI ? '可用 ✅' : '不可用 ❌' }}
          </text>
        </view>
      </view>

      <!-- 测试按钮 -->
      <view class="section">
        <text class="section-title">🧪 测试项目</text>

        <button class="test-btn primary" @tap="test1">
          <text class="btn-title">测试 1: 选择任意文件</text>
          <text class="btn-desc">不限制格式，测试基础功能</text>
        </button>

        <button class="test-btn primary" @tap="test2">
          <text class="btn-title">测试 2: 选择 Excel 文件</text>
          <text class="btn-desc">仅显示 .xlsx 和 .xls 文件</text>
        </button>

        <button class="test-btn primary" @tap="test3">
          <text class="btn-title">测试 3: 多选文件</text>
          <text class="btn-desc">允许选择最多 5 个文件</text>
        </button>

        <button class="test-btn warning" @tap="testPermission">
          <text class="btn-title">检查权限状态</text>
          <text class="btn-desc">查看是否需要授权</text>
        </button>
      </view>

      <!-- 日志输出 -->
      <view class="section">
        <text class="section-title">📋 测试日志</text>
        <scroll-view scroll-y class="log-container">
          <text class="log-text">{{ logText }}</text>
        </scroll-view>
        <button class="clear-btn" @tap="clearLog">清空日志</button>
      </view>

      <!-- 常见问题 -->
      <view class="section">
        <text class="section-title">❓ 常见问题</text>

        <view class="problem-item">
          <text class="problem-title">问题: 选择器列表为空</text>
          <text class="problem-reason">原因: 聊天记录中没有符合条件的文件</text>
          <text class="problem-solution">解决: 让朋友发送一个 Excel 文件给你</text>
        </view>

        <view class="problem-item">
          <text class="problem-title">问题: 看不到刚发的文件</text>
          <text class="problem-reason">原因: 文件格式不是 .xlsx 或 .xls</text>
          <text class="problem-solution">解决: 确认文件格式正确</text>
        </view>

        <view class="problem-item">
          <text class="problem-title">问题: 提示权限不足</text>
          <text class="problem-reason">原因: 未授权访问聊天记录</text>
          <text class="problem-solution">解决: 删除小程序重新进入</text>
        </view>

        <view class="problem-item highlight">
          <text class="problem-title">⚠️ 重要提示</text>
          <text class="problem-desc">• 必须是他人发送的文件</text>
          <text class="problem-desc">• 不能是文件传输助手的文件</text>
          <text class="problem-desc">• 文件格式必须是 .xlsx 或 .xls</text>
        </view>
      </view>

      <!-- 使用网页端 -->
      <view class="section">
        <text class="section-title">🌐 替代方案</text>
        <button class="test-btn success" @tap="openWeb">
          <text class="btn-title">使用网页端导入</text>
          <text class="btn-desc">不受任何限制，最稳定</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      deviceInfo: {
        platform: '',
        version: '',
        SDKVersion: ''
      },
      hasAPI: false,
      isBaseLibSupported: false,
      logText: '准备就绪，点击上方按钮开始测试...\n'
    }
  },
  onLoad() {
    this.init()
  },
  methods: {
    init() {
      // #ifdef MP-WEIXIN
      try {
        const info = wx.getSystemInfoSync()
        this.deviceInfo = {
          platform: info.platform,
          version: info.version,
          SDKVersion: info.SDKVersion
        }

        this.hasAPI = typeof wx.chooseMessageFile === 'function'

        // 检查基础库版本
        const versionParts = info.SDKVersion.split('.')
        const major = parseInt(versionParts[0])
        const minor = parseInt(versionParts[1] || 0)
        this.isBaseLibSupported = (major > 2) || (major === 2 && minor >= 5)

        this.log('========== 设备信息 ==========')
        this.log(`平台: ${info.platform}`)
        this.log(`微信: ${info.version}`)
        this.log(`基础库: ${info.SDKVersion}`)
        this.log(`API: ${this.hasAPI ? '可用' : '不可用'}`)
        this.log(`环境: ${info.platform === 'devtools' ? '开发工具 ⚠️' : '真机 ✅'}`)
        this.log('')

        if (info.platform === 'devtools') {
          this.log('⚠️ 警告：开发工具可能无法正常工作')
          this.log('建议：使用真机调试')
        }
      } catch (e) {
        this.log(`初始化失败: ${e.message}`)
      }
      // #endif
    },

    log(msg) {
      const time = new Date().toLocaleTimeString()
      this.logText += `[${time}] ${msg}\n`
    },

    clearLog() {
      this.logText = '日志已清空\n'
    },

    async test1() {
      this.log('\n========== 测试1: 选择任意文件 ==========')
      await this.doChooseFile({
        count: 1,
        type: 'file'
      })
    },

    async test2() {
      this.log('\n========== 测试2: 选择Excel文件 ==========')
      await this.doChooseFile({
        count: 1,
        type: 'file',
        extension: ['.xlsx', '.xls']
      })
    },

    async test3() {
      this.log('\n========== 测试3: 多选文件 ==========')
      await this.doChooseFile({
        count: 5,
        type: 'file',
        extension: ['.xlsx', '.xls']
      })
    },

    async doChooseFile(options) {
      // #ifdef MP-WEIXIN
      try {
        this.log(`参数: ${JSON.stringify(options)}`)
        this.log('正在打开文件选择器...')

        const res = await new Promise((resolve, reject) => {
          wx.chooseMessageFile({
            ...options,
            success: (res) => {
              this.log('✅ 用户选择了文件')
              resolve(res)
            },
            fail: (err) => {
              this.log(`❌ 失败: ${err.errMsg}`)
              reject(err)
            },
            complete: () => {
              this.log('选择器已关闭')
            }
          })
        })

        this.log('\n---------- 文件信息 ----------')
        this.log(`文件数量: ${res.tempFiles.length}`)

        res.tempFiles.forEach((file, idx) => {
          this.log(`\n文件 ${idx + 1}:`)
          this.log(`  名称: ${file.name}`)
          this.log(`  大小: ${(file.size / 1024).toFixed(2)} KB`)
          this.log(`  类型: ${file.type || '未知'}`)
          this.log(`  路径: ${file.path.substring(0, 30)}...`)
        })

        wx.showModal({
          title: '✅ 选择成功',
          content: `成功选择 ${res.tempFiles.length} 个文件\n第一个: ${res.tempFiles[0].name}`,
          showCancel: false
        })

      } catch (e) {
        this.log('\n---------- 错误详情 ----------')
        this.log(`错误: ${e.errMsg}`)

        if (e.errMsg && e.errMsg.includes('cancel')) {
          this.log('用户取消了选择（这是正常操作）')
          wx.showToast({
            title: '已取消',
            icon: 'none'
          })
        } else {
          this.showErrorMessage(e)
        }
      }
      // #endif
    },

    testPermission() {
      this.log('\n========== 检查权限 ==========')

      // #ifdef MP-WEIXIN
      wx.getSetting({
        success: (res) => {
          this.log('权限设置:')
          this.log(JSON.stringify(res.authSetting, null, 2))

          if (Object.keys(res.authSetting).length === 0) {
            this.log('\n当前没有权限记录')
            this.log('chooseMessageFile 使用时会自动请求授权')
          }
        },
        fail: (err) => {
          this.log(`获取权限失败: ${err.errMsg}`)
        }
      })
      // #endif
    },

    showErrorMessage(error) {
      let content = ''

      if (error.errMsg.includes('no permission')) {
        content = '权限不足\n\n解决方法:\n1. 删除小程序\n2. 重新进入\n3. 授权访问'
      } else if (error.errMsg.includes('file not found')) {
        content = '文件不存在或已过期\n\n解决方法:\n让发送者重新发送文件'
      } else {
        content = `错误: ${error.errMsg}\n\n建议:\n1. 删除小程序重试\n2. 使用网页端导入`
      }

      wx.showModal({
        title: '选择失败',
        content: content,
        showCancel: false
      })
    },

    openWeb() {
      wx.setClipboardData({
        data: 'https://api.zyqing.xyz',
        success: () => {
          wx.showModal({
            title: '网页端地址已复制',
            content: '请打开浏览器访问:\n\nhttps://api.zyqing.xyz\n\n在网页端上传文件，数据会自动同步到小程序',
            showCancel: false
          })
        }
      })
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0fdfa, #f5f7fa);
  padding: 20rpx;
  padding-bottom: 60rpx;
}

.container {
  max-width: 750rpx;
  margin: 0 auto;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #0d9488;
  text-align: center;
  margin: 40rpx 0;
}

.section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24rpx;
}

.info-section .info-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.label {
  font-size: 28rpx;
  color: #6b7280;
  width: 160rpx;
}

.value {
  font-size: 28rpx;
  color: #1f2937;
  flex: 1;
  font-weight: 500;
}

.badge {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
}

.badge.success {
  background: #d1fae5;
  color: #065f46;
}

.badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.badge.error {
  background: #fee2e2;
  color: #991b1b;
}

.test-btn {
  width: 100%;
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  color: white;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-shadow: 0 4rpx 12rpx rgba(13, 148, 136, 0.3);
}

.test-btn.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.3);
}

.test-btn.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4rpx 12rpx rgba(16, 185, 129, 0.3);
}

.btn-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.btn-desc {
  font-size: 24rpx;
  opacity: 0.9;
}

.log-container {
  background: #1f2937;
  border-radius: 12rpx;
  padding: 20rpx;
  height: 500rpx;
  margin-bottom: 16rpx;
}

.log-text {
  font-size: 24rpx;
  color: #10b981;
  font-family: 'Courier New', monospace;
  line-height: 1.8;
  white-space: pre-wrap;
}

.clear-btn {
  width: 100%;
  background: #6b7280;
  color: white;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.problem-item {
  background: #f9fafb;
  border-left: 4rpx solid #d1d5db;
  padding: 20rpx;
  margin-bottom: 16rpx;
  border-radius: 8rpx;
}

.problem-item.highlight {
  background: #fef3c7;
  border-left-color: #f59e0b;
}

.problem-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
}

.problem-reason,
.problem-solution {
  display: block;
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 4rpx;
}

.problem-desc {
  display: block;
  font-size: 24rpx;
  color: #92400e;
  margin-top: 8rpx;
}
</style>
