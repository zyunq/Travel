<template>
  <el-card class="group-summary">
    <template #header>
      <div class="card-header">
        <span>团信息汇总</span>
        <el-button type="primary" size="small" @click="copyInfo">复制团信息</el-button>
      </div>
    </template>

    <el-descriptions :column="3" border>
      <el-descriptions-item label="车次">{{ group.trainNo }}</el-descriptions-item>
      <el-descriptions-item label="行程">{{ group.route }}</el-descriptions-item>
      <el-descriptions-item label="出发日期">{{ group.departDate }}</el-descriptions-item>
    </el-descriptions>

    <el-divider />

    <div class="fee-detail">
      <div class="fee-row">
        <span>成人票：{{ summary.adultCount }}张 × {{ group.adultPrice }}元 = {{ summary.adultCount * group.adultPrice }}元</span>
      </div>
      <div class="fee-row">
        <span>儿童票：{{ summary.childCount }}张 × {{ group.childPrice }}元 = {{ summary.childCount * group.childPrice }}元</span>
      </div>
      <el-divider />
      <div class="fee-row">
        <span>票价小计：{{ summary.ticketTotal }}元</span>
      </div>
      <div class="fee-row">
        <span>购票服务费：{{ summary.serviceFeeCount || group.members?.length }}张 × {{ config.serviceFee }}元 = {{ summary.serviceFee }}元</span>
      </div>
      <div class="fee-row">
        <span>退票服务费：{{ summary.refundCount }}张 × {{ config.refundServiceFee }}元 = {{ summary.refundFee }}元</span>
      </div>
      <div class="fee-row">
        <span>核验费：{{ group.verifyCount }}次 × {{ config.foreignIdVerify }}元 = {{ summary.verifyFee }}元</span>
      </div>
      <div class="fee-row">
        <span>电子发票费：{{ summary.invoiceCount }}次 × {{ config.electronicInvoice }}元 = {{ summary.invoiceFee }}元</span>
      </div>
      <el-divider />
      <div class="fee-row total">
        <span>共计：{{ summary.total }}元</span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
const props = defineProps({
  group: { type: Object, default: () => ({}) },
  summary: { type: Object, default: () => ({}) },
  config: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['copy'])

const copyInfo = async () => {
  emit('copy')
}
</script>

<style scoped>
.group-summary {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fee-detail {
  font-size: 14px;
}

.fee-row {
  padding: 8px 0;
}

.fee-row.total {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}
</style>
