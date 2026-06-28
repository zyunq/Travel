<template>
  <view class="page">
    <!-- Header -->
    <view class="header-bg">
      <view class="header-content">
        <view class="header-top">
          <view class="header-left">
            <text class="header-title">Travel Groups</text>
            <text class="header-subtitle">Travel Group Manager</text>
          </view>
          <view class="header-right">
            <view class="date-badge">
              <text class="date-text">{{ currentDate }}</text>
            </view>
          </view>
        </view>

        <!-- Stats Cards -->
        <view class="stats-container">
          <view class="stat-card">
            <view class="stat-icon-wrap">
              <text class="stat-emoji">📁</text>
            </view>
            <view class="stat-body">
              <text class="stat-num">{{ categories.length }}</text>
              <text class="stat-label">Categories</text>
            </view>
          </view>
          <view class="stat-card highlight">
            <view class="stat-icon-wrap">
              <text class="stat-emoji">📋</text>
            </view>
            <view class="stat-body">
              <text class="stat-num">{{ groupedGroups.length }}</text>
              <text class="stat-label">Groups</text>
            </view>
          </view>
          <view class="stat-card">
            <view class="stat-icon-wrap">
              <text class="stat-emoji">🚄</text>
            </view>
            <view class="stat-body">
              <text class="stat-num">{{ todayTrips }}</text>
              <text class="stat-label">Today</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Main Content -->
    <view class="main-content">
      <!-- Search Bar -->
      <view class="search-bar">
        <view class="search-input-wrap">
          <text class="search-icon">🔍</text>
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="Search groups..."
            placeholder-class="placeholder"
          />
        </view>
        <view class="add-btn" @tap="showImport = true">
          <text class="add-icon">+</text>
        </view>
      </view>

      <!-- Categories -->
      <view v-if="categories.length > 0" class="section">
        <view class="section-header">
          <text class="section-title">📂 Categories</text>
        </view>
        <scroll-view scroll-x class="category-scroll">
          <view
            v-for="category in categories"
            :key="category"
            class="category-item"
            @tap="selectCategory(category)"
          >
            <view class="category-icon">
              <text>📁</text>
            </view>
            <view class="category-info">
              <text class="category-name">{{ category }}</text>
              <text class="category-count">{{ getCategoryGroupCount(category) }} groups</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- Group List -->
      <view class="group-list">
        <view v-for="groupItem in displayGroups" :key="groupItem.groupName" class="group-section">
          <view class="group-header">
            <view class="group-title-wrap">
              <text class="group-icon">👥</text>
              <text class="group-name">{{ groupItem.groupName }}</text>
            </view>
            <view class="trip-badge">
              <text>{{ groupItem.trips.length }} trips</text>
            </view>
          </view>

          <view class="trip-cards">
            <view
              v-for="trip in groupItem.trips"
              :key="trip.id"
              class="trip-card"
              :class="trip.tripType === 'go' ? 'trip-go' : 'trip-back'"
              @tap="goDetail(trip.id)"
            >
              <view class="trip-header">
                <view class="trip-type-tag" :class="trip.tripType === 'go' ? 'tag-go' : 'tag-back'">
                  <text>{{ trip.tripType === 'go' ? '🚀' : '🏠' }} {{ trip.tripType === 'go' ? 'Go' : 'Back' }}</text>
                </view>
                <view class="member-badge">
                  <text>{{ trip._count?.members || 0 }} pax</text>
                </view>
              </view>

              <view class="trip-body">
                <view class="trip-info-item">
                  <text class="info-icon">🚄</text>
                  <text class="info-text">{{ trip.trainNo }}</text>
                </view>
                <view class="trip-info-item">
                  <text class="info-icon">📍</text>
                  <text class="info-text">{{ trip.route }}</text>
                </view>
                <view class="trip-info-item">
                  <text class="info-icon">📅</text>
                  <text class="info-text">{{ trip.departDate }}</text>
                </view>
              </view>

              <view class="trip-arrow">
                <text>›</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Empty State -->
        <view v-if="displayGroups.length === 0 && !loading" class="empty-state">
          <view class="empty-icon-wrap">
            <text class="empty-icon">📂</text>
          </view>
          <text class="empty-title">No Groups</text>
          <text class="empty-desc">Click + to import data</text>
        </view>
      </view>
    </view>

    <!-- Import Popup -->
    <view v-if="showImport" class="popup-mask" @tap="showImport = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">Import Excel</text>
          <text class="popup-close" @tap="showImport = false">✕</text>
        </view>

        <view class="popup-body">
          <view class="form-group">
            <text class="form-label">Group Name <text class="required">*</text></text>
            <input
              class="form-input"
              v-model="importForm.groupName"
              placeholder="Enter group name"
              placeholder-class="input-placeholder"
            />
          </view>

          <view class="form-group">
            <text class="form-label">Trip Type</text>
            <view class="trip-type-switch">
              <view
                class="type-btn"
                :class="{ active: importForm.tripType === 'go' }"
                @tap="importForm.tripType = 'go'"
              >
                <text class="type-emoji">🚀</text>
                <text class="type-label">Go</text>
              </view>
              <view
                class="type-btn"
                :class="{ active: importForm.tripType === 'back' }"
                @tap="importForm.tripType = 'back'"
              >
                <text class="type-emoji">🏠</text>
                <text class="type-label">Back</text>
              </view>
            </view>
          </view>

          <button class="submit-btn" @tap="chooseFile">
            <text class="btn-icon">📄</text>
            <text class="btn-text">Select Excel File</text>
          </button>
        </view>
      </view>
    </view>

    <!-- Custom TabBar -->
    <CustomTabbar />
  </view>
</template>

<script>
import { groupApi } from '@/utils/api'
import CustomTabbar from '@/components/CustomTabbar.vue'

export default {
  components: {
    CustomTabbar
  },
  data() {
    return {
      loading: false,
      searchKeyword: '',
      groups: [],
      showImport: false,
      importForm: {
        groupName: '',
        tripType: 'go'
      }
    }
  },
  computed: {
    currentDate() {
      const now = new Date()
      const month = now.getMonth() + 1
      const day = now.getDate()
      return `${month}/${day}`
    },
    categories() {
      const cats = new Set()
      this.groups.forEach(g => {
        if (g.category) cats.add(g.category)
      })
      return Array.from(cats)
    },
    todayTrips() {
      const today = new Date().toISOString().slice(0, 10)
      return this.groups.filter(g => g.departDate === today).length
    },
    groupedGroups() {
      const grouped = {}
      this.groups.forEach(trip => {
        if (!grouped[trip.groupName]) {
          grouped[trip.groupName] = { groupName: trip.groupName, trips: [] }
        }
        grouped[trip.groupName].trips.push(trip)
      })
      return Object.values(grouped)
    },
    displayGroups() {
      if (!this.searchKeyword.trim()) return this.groupedGroups
      const keyword = this.searchKeyword.toLowerCase()
      return this.groupedGroups.filter(g => g.groupName.toLowerCase().includes(keyword))
    }
  },
  onLoad() {
    console.log('Index page loaded')
    this.loadGroups()
  },
  methods: {
    getCategoryGroupCount(category) {
      const names = new Set()
      this.groups.filter(g => g.category === category).forEach(g => names.add(g.groupName))
      return names.size
    },
    async loadGroups() {
      this.loading = true
      try {
        this.groups = await groupApi.getList()
      } catch (e) {
        uni.showToast({ title: 'Load failed', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    goDetail(tripId) {
      uni.navigateTo({ url: `/pages/group/detail?id=${tripId}` })
    },
    selectCategory(category) {
      uni.showToast({ title: category, icon: 'none' })
    },
    async chooseFile() {
      if (!this.importForm.groupName) {
        uni.showToast({ title: 'Enter group name', icon: 'none' })
        return
      }

      try {
        const res = await uni.chooseMessageFile({
          count: 1,
          type: 'file',
          extension: ['.xlsx', '.xls']
        })

        const filePath = res.tempFiles[0].path
        await groupApi.import({
          filePath,
          data: this.importForm
        })

        uni.showToast({ title: 'Import success', icon: 'success' })
        this.showImport = false
        this.importForm.groupName = ''
        this.loadGroups()
      } catch (e) {
        uni.showToast({ title: 'Import failed', icon: 'none' })
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
  padding: 0 24rpx 40rpx;
  padding-top: calc(60rpx + env(safe-area-inset-top));
}

.header-content {
  padding-top: 20rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32rpx;
}

.header-left {
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
  letter-spacing: 2rpx;
}

.date-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
}

.date-text {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
}

.stats-container {
  display: flex;
  gap: 16rpx;
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
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.stat-icon-wrap {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
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

.main-content {
  padding: 24rpx;
  margin-top: -20rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input-wrap input {
  flex: 1;
  font-size: 28rpx;
  color: #1f2937;
}

.placeholder {
  color: #9ca3af;
}

.add-btn {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(13, 148, 136, 0.3);
}

.add-icon {
  font-size: 44rpx;
  color: #fff;
  font-weight: 300;
}

.section {
  margin-bottom: 24rpx;
}

.section-header {
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
}

.category-scroll {
  white-space: nowrap;
  padding: 8rpx 0;
}

.category-item {
  display: inline-flex;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 28rpx;
  margin-right: 16rpx;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.category-icon {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.category-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
}

.category-count {
  font-size: 20rpx;
  color: #6b7280;
}

.group-section {
  margin-bottom: 24rpx;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 8rpx;
}

.group-title-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.group-icon {
  font-size: 28rpx;
}

.group-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2937;
}

.trip-badge {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.trip-badge text {
  font-size: 22rpx;
  color: #0d9488;
  font-weight: 600;
}

.trip-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.trip-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.trip-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6rpx;
}

.trip-card.trip-go::before {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}

.trip-card.trip-back::before {
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
}

.trip-header {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex-shrink: 0;
}

.trip-type-tag {
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
}

.trip-type-tag.tag-go {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.trip-type-tag.tag-go text {
  color: #2563eb;
  font-size: 22rpx;
  font-weight: 600;
}

.trip-type-tag.tag-back {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
}

.trip-type-tag.tag-back text {
  color: #16a34a;
  font-size: 22rpx;
  font-weight: 600;
}

.member-badge {
  background: #f3f4f6;
  padding: 6rpx 14rpx;
  border-radius: 10rpx;
}

.member-badge text {
  font-size: 20rpx;
  color: #6b7280;
  font-weight: 500;
}

.trip-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.trip-info-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-icon {
  font-size: 22rpx;
}

.info-text {
  font-size: 24rpx;
  color: #4b5563;
}

.trip-arrow {
  width: 40rpx;
  height: 40rpx;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trip-arrow text {
  font-size: 28rpx;
  color: #9ca3af;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx;
}

.empty-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.empty-icon {
  font-size: 56rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: 24rpx;
  color: #9ca3af;
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
  margin-bottom: 28rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12rpx;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  height: 96rpx;
  background: #f9fafb;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #1f2937;
  box-sizing: border-box;
}

.input-placeholder {
  color: #9ca3af;
}

.trip-type-switch {
  display: flex;
  gap: 20rpx;
}

.type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
  background: #f9fafb;
  border: 2rpx solid #e5e7eb;
  border-radius: 20rpx;
}

.type-btn.active {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  border-color: #0d9488;
}

.type-emoji {
  font-size: 44rpx;
  margin-bottom: 8rpx;
}

.type-label {
  font-size: 28rpx;
  color: #6b7280;
  font-weight: 500;
}

.type-btn.active .type-label {
  color: #0d9488;
  font-weight: 600;
}

.submit-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 20rpx;
  border: none;
}

.submit-btn::after {
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
</style>
