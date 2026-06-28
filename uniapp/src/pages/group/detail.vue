<template>
  <view class="page">
    <!-- 顶部渐变背景 -->
    <view class="header-bg">
      <view class="header-content">
        <!-- 返回按钮 -->
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">←</text>
        </view>

        <view class="header-top">
          <view class="header-left">
            <text class="header-title">{{ groupInfo.groupName }}</text>
            <text class="header-subtitle">{{ groupInfo.trainNo }} · {{ groupInfo.route }}</text>
          </view>
          <view class="trip-type-tag" :class="groupInfo.tripType === '去程' ? 'tag-go' : 'tag-back'">
            <text>{{ groupInfo.tripType === '去程' ? '🚀' : '🏠' }} {{ groupInfo.tripType || '去程' }}</text>
          </view>
        </view>

        <view class="header-date">
          <text class="date-icon">📅</text>
          <text class="date-text">{{ groupInfo.departDate }}</text>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-container">
      <view class="stat-card">
        <view class="stat-icon-wrap adult">
          <text class="stat-emoji">👤</text>
        </view>
        <view class="stat-body">
          <text class="stat-num">{{ summary.adultCount }}</text>
          <text class="stat-label">成人票</text>
        </view>
      </view>
      <view class="stat-card highlight">
        <view class="stat-icon-wrap child">
          <text class="stat-emoji">👶</text>
        </view>
        <view class="stat-body">
          <text class="stat-num">{{ summary.childCount }}</text>
          <text class="stat-label">儿童票</text>
        </view>
      </view>
      <view class="stat-card">
        <view class="stat-icon-wrap refund">
          <text class="stat-emoji">↩️</text>
        </view>
        <view class="stat-body">
          <text class="stat-num">{{ summary.refundCount }}</text>
          <text class="stat-label">退票</text>
        </view>
      </view>
    </view>

    <!-- 费用汇总卡片 -->
    <view class="fee-card">
      <view class="fee-header">
        <text class="fee-title">💰 费用汇总</text>
      </view>

      <view class="fee-list">
        <view class="fee-row">
          <text class="fee-label">票价合计</text>
          <text class="fee-value">¥{{ summary.ticketTotal }}</text>
        </view>
        <view class="fee-row">
          <text class="fee-label">服务费（{{ summary.serviceFeeCount || members.length }}张）</text>
          <text class="fee-value">¥{{ summary.serviceFee }}</text>
        </view>
        <view class="fee-row" v-if="summary.refundFee > 0">
          <text class="fee-label">退票费</text>
          <text class="fee-value refund">¥{{ summary.refundFee }}</text>
        </view>
        <view class="fee-row">
          <text class="fee-label">核验费（</text>
          <input
            type="number"
            class="verify-input"
            v-model.number="groupInfo.verifyCount"
            @blur="updateVerifyCount"
          />
          <text class="fee-label">次）</text>
          <text class="fee-value">¥{{ summary.verifyFee }}</text>
        </view>
        <view class="fee-row total">
          <text class="fee-label">总计</text>
          <text class="fee-value">¥{{ summary.total }}</text>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-btn" @tap="showAddMember = true">
        <view class="action-icon add">
          <text>➕</text>
        </view>
        <text class="action-text">新增乘客</text>
      </view>
      <view class="action-btn" @tap="exportSeats">
        <view class="action-icon export">
          <text>📤</text>
        </view>
        <text class="action-text">导出座位表</text>
      </view>
      <view class="action-btn" @tap="copyInfo">
        <view class="action-icon copy">
          <text>📋</text>
        </view>
        <text class="action-text">复制信息</text>
      </view>
    </view>

    <!-- 乘客列表 -->
    <view class="member-section">
      <view class="section-header">
        <view class="section-title-wrap">
          <text class="section-icon">👥</text>
          <text class="section-title">乘客列表</text>
        </view>
        <view class="member-count-badge">
          <text>{{ filteredMembers.length }} 人</text>
        </view>
      </view>

      <!-- 搜索栏 -->
      <view class="member-search">
        <view class="search-input-wrap">
          <text class="search-icon">🔍</text>
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="搜索姓名..."
            placeholder-class="placeholder"
          />
          <text v-if="searchKeyword" class="clear-btn" @tap="searchKeyword = ''">✕</text>
        </view>
      </view>

      <scroll-view scroll-y class="member-scroll">
        <view
          v-for="member in filteredMembers"
          :key="member.id"
          class="member-card"
          :class="{ refunded: member.status === '退票' }"
        >
          <view class="member-main">
            <view class="member-avatar" :class="member.ticketType === '成人' ? 'avatar-adult' : 'avatar-child'">
              <text>{{ member.name?.charAt(0) || '?' }}</text>
            </view>

            <view class="member-info">
              <view class="member-top">
                <text class="member-name">{{ member.name }}</text>
                <view class="member-type-tag" :class="getTypeClass(member)">
                  <text>{{ member.status === '退票' ? '已退票' : member.ticketType }}</text>
                </view>
              </view>
              <view class="member-details">
                <view class="detail-item">
                  <text class="detail-icon">🚃</text>
                  <text>{{ member.carriage }}车厢</text>
                </view>
                <view class="detail-item">
                  <text class="detail-icon">💺</text>
                  <text>{{ member.seatNo }}</text>
                </view>
                <view class="detail-item">
                  <text class="detail-icon">🎫</text>
                  <text>{{ member.idType }}</text>
                </view>
              </view>
              <text class="member-id">{{ member.idNumber }}</text>
            </view>

            <view class="member-price">
              <text class="price-label">票价</text>
              <text class="price-value">¥{{ member.price }}</text>
            </view>
          </view>

          <view class="member-actions" v-if="member.status !== '退票'">
            <view class="action-item refund" @tap="refundMember(member)">
              <text class="action-icon-text">🔄</text>
              <text>退票</text>
            </view>
            <view class="action-item delete" @tap="deleteMember(member)">
              <text class="action-icon-text">🗑️</text>
              <text>删除</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredMembers.length === 0 && members.length > 0" class="empty-state">
          <view class="empty-icon-wrap">
            <text class="empty-icon">🔍</text>
          </view>
          <text class="empty-title">未找到"{{ searchKeyword }}"</text>
          <text class="empty-desc">请尝试其他关键词</text>
        </view>

        <view v-else-if="members.length === 0" class="empty-state">
          <view class="empty-icon-wrap">
            <text class="empty-icon">👥</text>
          </view>
          <text class="empty-title">暂无乘客信息</text>
        </view>
      </scroll-view>
    </view>

    <!-- 新增乘客弹窗 -->
    <view v-if="showAddMember" class="popup-mask" @tap="showAddMember = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">新增乘客</text>
          <text class="popup-close" @tap="showAddMember = false">✕</text>
        </view>

        <view class="popup-body">
          <view class="form-group">
            <text class="form-label">姓名 <text class="required">*</text></text>
            <input class="form-input" v-model="newMember.name" placeholder="请输入姓名" />
          </view>

          <view class="form-group">
            <text class="form-label">证件类型</text>
            <picker :value="idTypeIndex" :range="idTypes" @change="onIdTypeChange">
              <view class="form-picker">
                <text>{{ idTypes[idTypeIndex] }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>

          <view class="form-group">
            <text class="form-label">证件号码 <text class="required">*</text></text>
            <input class="form-input" v-model="newMember.idNumber" placeholder="请输入证件号码" />
          </view>

          <view class="form-row">
            <view class="form-group half">
              <text class="form-label">票型</text>
              <picker :value="ticketTypeIndex" :range="ticketTypes" @change="onTicketTypeChange">
                <view class="form-picker">
                  <text>{{ ticketTypes[ticketTypeIndex] }}</text>
                  <text class="picker-arrow">›</text>
                </view>
              </picker>
            </view>
            <view class="form-group half">
              <text class="form-label">票价</text>
              <input class="form-input" v-model="newMember.price" type="digit" placeholder="票价" />
            </view>
          </view>

          <view class="form-row">
            <view class="form-group half">
              <text class="form-label">车厢</text>
              <input class="form-input" v-model="newMember.carriage" placeholder="如: 5" />
            </view>
            <view class="form-group half">
              <text class="form-label">座号</text>
              <input class="form-input" v-model="newMember.seatNo" placeholder="如: 12A" />
            </view>
          </view>
        </view>

        <view class="popup-footer">
          <button class="btn-cancel" @tap="showAddMember = false">取消</button>
          <button class="btn-confirm" @tap="addMember">确定添加</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

const BASE_URL = 'http://101.34.71.12:3000/api'

const groupInfo = ref({})
const members = ref([])
const showAddMember = ref(false)
const searchKeyword = ref('')

const summary = reactive({
  adultCount: 0,
  childCount: 0,
  refundCount: 0,
  ticketTotal: 0,
  serviceFee: 0,
  serviceFeeCount: 0,
  refundFee: 0,
  verifyFee: 0,
  total: 0
})

const newMember = reactive({
  name: '',
  idType: '身份证',
  idNumber: '',
  ticketType: '成人',
  carriage: '',
  seatNo: '',
  price: ''
})

const idTypes = ['身份证', '护照', '港澳通行证', '台湾通行证']
const idTypeIndex = ref(0)
const ticketTypes = ['成人', '儿童']
const ticketTypeIndex = ref(0)

const goBack = () => {
  uni.navigateBack()
}

const getTypeClass = (member) => {
  if (member.status === '退票') return 'tag-refunded'
  return member.ticketType === '成人' ? 'tag-adult' : 'tag-child'
}

// 模糊搜索过滤乘客
const filteredMembers = computed(() => {
  if (!searchKeyword.value.trim()) {
    return members.value
  }
  const keyword = searchKeyword.value.toLowerCase().trim()
  return members.value.filter(member =>
    member.name && member.name.toLowerCase().includes(keyword)
  )
})

const onIdTypeChange = (e) => {
  idTypeIndex.value = e.detail.value
  newMember.idType = idTypes[e.detail.value]
}

const onTicketTypeChange = (e) => {
  ticketTypeIndex.value = e.detail.value
  newMember.ticketType = ticketTypes[e.detail.value]
  // 根据票型自动填充票价
  if (newMember.ticketType === '成人') {
    newMember.price = groupInfo.value.adultPrice || ''
  } else {
    newMember.price = groupInfo.value.childPrice || ''
  }
}

const loadDetail = async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const tripId = currentPage.options.id

  if (!tripId) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }

  uni.showLoading({ title: '加载中...' })

  try {
    const trip = await new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + '/groups/' + tripId,
        success: (r) => resolve(r.data),
        fail: reject
      })
    })

    groupInfo.value = trip

    if (trip.members) {
      members.value = trip.members
    }

    if (trip.summary) {
      Object.assign(summary, trip.summary)
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const addMember = async () => {
  if (!newMember.name || !newMember.idNumber) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }

  try {
    await new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + '/members',
        method: 'POST',
        data: {
          groupId: groupInfo.value.id,
          ...newMember,
          date: groupInfo.value.departDate,
          trainNo: groupInfo.value.trainNo,
          departStation: groupInfo.value.route?.split('-')[0] || '',
          arriveStation: groupInfo.value.route?.split('-')[1] || '',
          seatClass: '二等座',
          orderNo: ''
        },
        success: (r) => resolve(r.data),
        fail: reject
      })
    })

    uni.showToast({ title: '添加成功', icon: 'success' })
    showAddMember.value = false

    newMember.name = ''
    newMember.idNumber = ''
    newMember.carriage = ''
    newMember.seatNo = ''
    newMember.price = ''

    loadDetail()
  } catch (e) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

const refundMember = async (member) => {
  const res = await uni.showModal({
    title: '确认退票',
    content: `确定要退票 ${member.name} 吗？`
  })

  if (!res.confirm) return

  try {
    await new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + '/members/' + member.id + '/refund',
        method: 'PUT',
        success: (r) => resolve(r.data),
        fail: reject
      })
    })

    uni.showToast({ title: '退票成功', icon: 'success' })
    loadDetail()
  } catch (e) {
    uni.showToast({ title: '退票失败', icon: 'none' })
  }
}

const deleteMember = async (member) => {
  const res = await uni.showModal({
    title: '确认删除',
    content: `确定要删除 ${member.name} 吗？`
  })

  if (!res.confirm) return

  try {
    await new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + '/members/' + member.id,
        method: 'DELETE',
        success: (r) => resolve(r.data),
        fail: reject
      })
    })

    uni.showToast({ title: '删除成功', icon: 'success' })
    loadDetail()
  } catch (e) {
    uni.showToast({ title: '删除失败', icon: 'none' })
  }
}

// 更新核验次数
const updateVerifyCount = async () => {
  if (!groupInfo.value.id) return

  try {
    await new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + '/groups/' + groupInfo.value.id,
        method: 'PUT',
        data: { verifyCount: groupInfo.value.verifyCount || 0 },
        success: (r) => resolve(r.data),
        fail: reject
      })
    })

    // 重新计算 summary
    const config = await new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + '/config',
        success: (r) => resolve(r.data),
        fail: reject
      })
    })

    const verifyFee = (groupInfo.value.verifyCount || 0) * (config?.foreignIdVerify || 8)
    summary.verifyFee = verifyFee
    summary.total = summary.ticketTotal + summary.serviceFee + summary.refundFee + verifyFee

    uni.showToast({ title: '已更新', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

const exportSeats = async () => {
  if (!groupInfo.value.id) {
    uni.showToast({ title: '数据未加载', icon: 'none' })
    return
  }

  uni.showLoading({ title: '导出中...' })

  try {
    const downloadRes = await new Promise((resolve, reject) => {
      uni.downloadFile({
        url: BASE_URL + '/groups/' + groupInfo.value.id + '/seats',
        success: resolve,
        fail: reject
      })
    })

    uni.hideLoading()

    if (downloadRes.statusCode === 200) {
      uni.openDocument({
        filePath: downloadRes.tempFilePath,
        showMenu: true,
        success: () => {
          uni.showToast({ title: '打开成功', icon: 'success' })
        },
        fail: () => {
          uni.saveFile({
            tempFilePath: downloadRes.tempFilePath,
            success: () => {
              uni.showToast({ title: '已保存', icon: 'success' })
            }
          })
        }
      })
    }
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '导出失败', icon: 'none' })
  }
}

const copyInfo = async () => {
  if (!groupInfo.value.id) {
    uni.showToast({ title: '数据未加载', icon: 'none' })
    return
  }

  try {
    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + '/groups/' + groupInfo.value.id + '/copy',
        success: (r) => resolve(r.data),
        fail: reject
      })
    })

    uni.setClipboardData({
      data: res.text,
      success: () => {
        uni.showToast({ title: '已复制', icon: 'success' })
      }
    })
  } catch (e) {
    uni.showToast({ title: '复制失败', icon: 'none' })
  }
}

onMounted(loadDetail)
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 40rpx;
}

/* 顶部渐变背景 */
.header-bg {
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%);
  padding: 0 24rpx 40rpx;
  padding-top: calc(60rpx + env(safe-area-inset-top));
}

.header-content {
  padding-top: 20rpx;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.back-icon {
  font-size: 32rpx;
  color: #fff;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
}

.header-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.header-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.trip-type-tag {
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
}

.trip-type-tag text {
  font-size: 24rpx;
  color: #fff;
  font-weight: 600;
}

.tag-go {
  background: rgba(59, 130, 246, 0.5);
}

.tag-back {
  background: rgba(34, 197, 94, 0.5);
}

.header-date {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.15);
  padding: 12rpx 20rpx;
  border-radius: 16rpx;
  width: fit-content;
}

.date-icon {
  font-size: 24rpx;
}

.date-text {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
}

/* 统计卡片 */
.stats-container {
  display: flex;
  gap: 16rpx;
  padding: 0 24rpx;
  margin-top: -20rpx;
}

.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 20rpx 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-card.highlight {
  background: #fff;
  transform: scale(1.02);
  box-shadow: 0 12px 32px rgba(13, 148, 136, 0.15);
}

.stat-icon-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrap.adult {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.stat-icon-wrap.child {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-icon-wrap.refund {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.stat-emoji {
  font-size: 28rpx;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.stat-num {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 20rpx;
  color: #6b7280;
}

/* 费用汇总卡片 */
.fee-card {
  background: #fff;
  margin: 24rpx 24rpx 0;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
}

.fee-header {
  margin-bottom: 20rpx;
}

.fee-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.fee-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.verify-input {
  width: 60rpx;
  height: 48rpx;
  border: 1px solid #d1d5db;
  border-radius: 8rpx;
  text-align: center;
  font-size: 26rpx;
  background: #f9fafb;
}

.fee-label {
  font-size: 26rpx;
  color: #6b7280;
}

.fee-value {
  font-size: 26rpx;
  color: #1f2937;
  font-weight: 500;
}

.fee-value.refund {
  color: #ef4444;
}

.fee-row.total {
  margin-top: 12rpx;
  padding-top: 16rpx;
  border-top: 1px solid #f3f4f6;
}

.fee-row.total .fee-label,
.fee-row.total .fee-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #0d9488;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 24rpx 0;
}

.action-btn {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.action-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.action-icon.add {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
}

.action-icon.export {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.action-icon.copy {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.action-text {
  font-size: 24rpx;
  color: #4b5563;
  font-weight: 500;
}

/* 乘客列表 */
.member-section {
  background: #fff;
  margin: 24rpx 24rpx 0;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.section-icon {
  font-size: 28rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.member-count-badge {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.member-count-badge text {
  font-size: 22rpx;
  color: #0d9488;
  font-weight: 600;
}

/* 搜索栏 */
.member-search {
  margin-bottom: 20rpx;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #f0fdfa;
  border: 2rpx solid #99f6e4;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input-wrap input {
  flex: 1;
  font-size: 26rpx;
  color: #1f2937;
}

.placeholder {
  color: #9ca3af;
}

.clear-btn {
  font-size: 28rpx;
  color: #0d9488;
  padding: 4rpx 8rpx;
}

.member-scroll {
  max-height: 800rpx;
}

.member-card {
  background: #f9fafb;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-left: 6rpx solid #0d9488;
}

.member-card.refunded {
  opacity: 0.6;
  background: #fef2f2;
  border-left-color: #ef4444;
}

.member-main {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.member-avatar {
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-avatar text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}

.avatar-adult {
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
}

.avatar-child {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.member-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.member-type-tag {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.member-type-tag text {
  font-size: 20rpx;
  font-weight: 500;
}

.tag-adult {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
}

.tag-adult text {
  color: #0d9488;
}

.tag-child {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.tag-child text {
  color: #d97706;
}

.tag-refunded {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.tag-refunded text {
  color: #dc2626;
}

.member-details {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 6rpx;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 22rpx;
  color: #6b7280;
}

.detail-icon {
  font-size: 20rpx;
}

.member-id {
  font-size: 20rpx;
  color: #9ca3af;
}

.member-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.price-label {
  font-size: 18rpx;
  color: #9ca3af;
}

.price-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #0d9488;
}

.member-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1px solid #e5e7eb;
}

.action-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 14rpx 0;
  border-radius: 12rpx;
}

.action-item text {
  font-size: 24rpx;
  font-weight: 500;
}

.action-item.refund {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.action-item.refund text {
  color: #d97706;
}

.action-item.delete {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.action-item.delete text {
  color: #dc2626;
}

.action-icon-text {
  font-size: 24rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.empty-icon-wrap {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.empty-icon {
  font-size: 48rpx;
}

.empty-title {
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
}

.empty-desc {
  font-size: 24rpx;
  color: #9ca3af;
  margin-top: 8rpx;
}

/* 弹窗 */
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
  display: flex;
  flex-direction: column;
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
  flex: 1;
  padding: 24rpx 32rpx;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-group.half {
  flex: 1;
}

.form-row {
  display: flex;
  gap: 20rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10rpx;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #f0fdfa;
  border: 2rpx solid #99f6e4;
  border-radius: 14rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #1f2937;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #0d9488;
  background: #fff;
}

.form-picker {
  height: 88rpx;
  background: #f0fdfa;
  border: 2rpx solid #99f6e4;
  border-radius: 14rpx;
  padding: 0 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #1f2937;
}

.picker-arrow {
  font-size: 28rpx;
  color: #0d9488;
}

.popup-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1px solid #f3f4f6;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 96rpx;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-confirm {
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  color: #fff;
  box-shadow: 0 8px 24px rgba(13, 148, 136, 0.3);
}

.btn-confirm::after,
.btn-cancel::after {
  border: none;
}
</style>
