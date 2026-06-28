<template>
  <view class="custom-tabbar">
    <view
      v-for="(item, index) in tabList"
      :key="index"
      class="tabbar-item"
      :class="{ active: currentIndex === index }"
      @tap="switchTab(index)"
    >
      <view class="tabbar-icon">
        <!-- 旅游团图标：三个人 -->
        <view v-if="index === 0" class="icon-group">
          <view class="person center"></view>
          <view class="person left"></view>
          <view class="person right"></view>
        </view>
        <!-- 配置图标：齿轮 -->
        <view v-else class="icon-config">
          <view class="gear-outer"></view>
          <view class="gear-inner"></view>
        </view>
      </view>
      <text class="tabbar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const tabList = [
  { pagePath: '/pages/index/index', text: '旅游团' },
  { pagePath: '/pages/config/config', text: '配置' }
]

const currentIndex = ref(0)

const switchTab = (index) => {
  if (currentIndex.value === index) return
  currentIndex.value = index
  uni.switchTab({
    url: tabList[index].pagePath
  })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const path = '/' + currentPage.route
  currentIndex.value = tabList.findIndex(item => item.pagePath === path)
})
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
}

.tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  transition: all 0.3s ease;
}

.tabbar-item.active .tabbar-text {
  color: #0d9488;
}

.tabbar-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4rpx;
}

.tabbar-text {
  font-size: 22rpx;
  color: #6b7280;
  transition: color 0.3s ease;
}

/* 团队图标：三个人形 */
.icon-group {
  position: relative;
  width: 48rpx;
  height: 48rpx;
}

.icon-group .person {
  position: absolute;
  background: #6b7280;
  transition: background 0.3s ease;
}

.tabbar-item.active .icon-group .person {
  background: #0d9488;
}

/* 中间的人 */
.icon-group .person.center {
  width: 20rpx;
  height: 32rpx;
  border-radius: 10rpx 10rpx 6rpx 6rpx;
  left: 50%;
  bottom: 4rpx;
  transform: translateX(-50%);
}

.icon-group .person.center::before {
  content: '';
  position: absolute;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: inherit;
  top: -10rpx;
  left: 50%;
  transform: translateX(-50%);
}

/* 左边的人 */
.icon-group .person.left {
  width: 16rpx;
  height: 26rpx;
  border-radius: 8rpx 8rpx 5rpx 5rpx;
  left: 2rpx;
  bottom: 4rpx;
}

.icon-group .person.left::before {
  content: '';
  position: absolute;
  width: 11rpx;
  height: 11rpx;
  border-radius: 50%;
  background: inherit;
  top: -8rpx;
  left: 50%;
  transform: translateX(-50%);
}

/* 右边的人 */
.icon-group .person.right {
  width: 16rpx;
  height: 26rpx;
  border-radius: 8rpx 8rpx 5rpx 5rpx;
  right: 2rpx;
  bottom: 4rpx;
}

.icon-group .person.right::before {
  content: '';
  position: absolute;
  width: 11rpx;
  height: 11rpx;
  border-radius: 50%;
  background: inherit;
  top: -8rpx;
  left: 50%;
  transform: translateX(-50%);
}

/* 配置图标：齿轮 */
.icon-config {
  position: relative;
  width: 44rpx;
  height: 44rpx;
}

.icon-config .gear-outer {
  position: absolute;
  width: 44rpx;
  height: 44rpx;
  top: 0;
  left: 0;
  background: #6b7280;
  border-radius: 50%;
  clip-path: polygon(
    50% 0%,
    58% 15%,
    75% 10%,
    70% 28%,
    85% 35%,
    70% 45%,
    75% 63%,
    58% 58%,
    50% 75%,
    42% 58%,
    25% 63%,
    30% 45%,
    15% 35%,
    30% 28%,
    25% 10%,
    42% 15%
  );
  transition: background 0.3s ease;
}

.tabbar-item.active .gear-outer {
  background: #0d9488;
}

.icon-config .gear-inner {
  position: absolute;
  width: 14rpx;
  height: 14rpx;
  background: #ffffff;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}
</style>
