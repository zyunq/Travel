<template>
  <view class="page">
    <!-- Header -->
    <view class="header-bg">
      <view class="header-content">
        <text class="header-title">Fee Config</text>
        <text class="header-subtitle">Service fee settings</text>
      </view>
    </view>

    <!-- Main Content -->
    <view class="main-content">
      <view class="config-card">
        <view class="config-item">
          <view class="config-left">
            <text class="config-icon">🎫</text>
            <view class="config-info">
              <text class="config-label">Ticket Service Fee</text>
              <text class="config-desc">Per ticket fee</text>
            </view>
          </view>
          <view class="config-right">
            <text class="config-value">{{ config.serviceFee }}</text>
            <text class="config-unit">CNY</text>
          </view>
        </view>

        <view class="config-item">
          <view class="config-left">
            <text class="config-icon">↩️</text>
            <view class="config-info">
              <text class="config-label">Refund Service Fee</text>
              <text class="config-desc">Per refund fee</text>
            </view>
          </view>
          <view class="config-right">
            <text class="config-value">{{ config.refundServiceFee }}</text>
            <text class="config-unit">CNY</text>
          </view>
        </view>

        <view class="config-item">
          <view class="config-left">
            <text class="config-icon">🔍</text>
            <view class="config-info">
              <text class="config-label">ID Verification Fee</text>
              <text class="config-desc">Foreign passport verification</text>
            </view>
          </view>
          <view class="config-right">
            <text class="config-value">{{ config.foreignIdVerify }}</text>
            <text class="config-unit">CNY</text>
          </view>
        </view>

        <view class="config-item">
          <view class="config-left">
            <text class="config-icon">🧾</text>
            <view class="config-info">
              <text class="config-label">Electronic Invoice Fee</text>
              <text class="config-desc">Per invoice fee</text>
            </view>
          </view>
          <view class="config-right">
            <text class="config-value">{{ config.electronicInvoice }}</text>
            <text class="config-unit">CNY</text>
          </view>
        </view>
      </view>

      <!-- Edit Button -->
      <button class="edit-btn" @tap="showEdit = true">
        <text class="btn-icon">✏️</text>
        <text class="btn-text">Edit Config</text>
      </button>
    </view>

    <!-- Edit Popup -->
    <view v-if="showEdit" class="popup-mask" @tap="showEdit = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">Edit Config</text>
          <text class="popup-close" @tap="showEdit = false">✕</text>
        </view>

        <view class="popup-body">
          <view class="form-group">
            <text class="form-label">Ticket Service Fee (CNY)</text>
            <input
              class="form-input"
              type="digit"
              v-model="editForm.serviceFee"
              placeholder="Enter fee"
            />
          </view>

          <view class="form-group">
            <text class="form-label">Refund Service Fee (CNY)</text>
            <input
              class="form-input"
              type="digit"
              v-model="editForm.refundServiceFee"
              placeholder="Enter fee"
            />
          </view>

          <view class="form-group">
            <text class="form-label">ID Verification Fee (CNY)</text>
            <input
              class="form-input"
              type="digit"
              v-model="editForm.foreignIdVerify"
              placeholder="Enter fee"
            />
          </view>

          <view class="form-group">
            <text class="form-label">Electronic Invoice Fee (CNY)</text>
            <input
              class="form-input"
              type="digit"
              v-model="editForm.electronicInvoice"
              placeholder="Enter fee"
            />
          </view>

          <button class="submit-btn" @tap="saveConfig">
            <text class="btn-text">Save</text>
          </button>
        </view>
      </view>
    </view>

    <!-- Custom TabBar -->
    <CustomTabbar />
  </view>
</template>

<script>
import { configApi } from '@/utils/api'
import CustomTabbar from '@/components/CustomTabbar.vue'

export default {
  components: {
    CustomTabbar
  },
  data() {
    return {
      config: {
        serviceFee: 10,
        refundServiceFee: 20,
        foreignIdVerify: 8,
        electronicInvoice: 3
      },
      editForm: {
        serviceFee: '',
        refundServiceFee: '',
        foreignIdVerify: '',
        electronicInvoice: ''
      },
      showEdit: false,
      loading: false
    }
  },
  onLoad() {
    this.loadConfig()
  },
  methods: {
    async loadConfig() {
      try {
        const res = await configApi.get()
        this.config = res
        this.editForm = { ...res }
      } catch (e) {
        uni.showToast({ title: 'Load failed', icon: 'none' })
      }
    },
    async saveConfig() {
      this.loading = true
      try {
        await configApi.update({
          serviceFee: parseFloat(this.editForm.serviceFee) || 0,
          refundServiceFee: parseFloat(this.editForm.refundServiceFee) || 0,
          foreignIdVerify: parseFloat(this.editForm.foreignIdVerify) || 0,
          electronicInvoice: parseFloat(this.editForm.electronicInvoice) || 0
        })
        this.config = { ...this.editForm }
        this.showEdit = false
        uni.showToast({ title: 'Saved', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: 'Save failed', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 120rpx;
}

.header-bg {
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%);
  padding: 40rpx 24rpx;
  padding-top: calc(60rpx + env(safe-area-inset-top));
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.header-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.header-subtitle {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.main-content {
  padding: 24rpx;
  margin-top: -20rpx;
}

.config-card {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1px solid #f3f4f6;
}

.config-item:last-child {
  border-bottom: none;
}

.config-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.config-icon {
  font-size: 36rpx;
}

.config-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.config-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.config-desc {
  font-size: 22rpx;
  color: #6b7280;
}

.config-right {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.config-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #0d9488;
}

.config-unit {
  font-size: 22rpx;
  color: #6b7280;
}

.edit-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 24rpx;
  border: none;
}

.edit-btn::after {
  border: none;
}

.btn-icon {
  font-size: 32rpx;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}

.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.popup-content {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  max-height: 85vh;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1px solid #f3f4f6;
}

.popup-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
}

.popup-close {
  font-size: 32rpx;
  color: #9ca3af;
  padding: 8rpx;
}

.popup-body {
  padding: 32rpx;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #f9fafb;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #1f2937;
  box-sizing: border-box;
}

.submit-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20rpx;
  border: none;
}

.submit-btn::after {
  border: none;
}

.submit-btn .btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}
</style>
