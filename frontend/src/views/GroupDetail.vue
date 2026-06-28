<template>
  <div class="group-detail">
    <el-page-header @back="goBack">
      <template #content>
        <span class="group-name-header">{{ groupName }}</span>
      </template>
    </el-page-header>

    <div v-loading="loading">
      <!-- 各行程卡片 -->
      <div class="trips-section">
        <el-row :gutter="24">
          <el-col :xs="24" :lg="12" v-for="trip in trips" :key="trip.id">
            <el-card class="trip-card" shadow="hover">
              <template #header>
                <div class="trip-header">
                  <span>
                    <el-tag :type="trip.tripType === '去程' ? 'primary' : 'success'" size="small">{{ trip.tripType }}</el-tag>
                    <span class="trip-info">{{ trip.trainNo }} | {{ trip.route }}</span>
                  </span>
                  <div class="trip-actions">
                    <el-button type="success" link size="small" @click="exportSeats(trip.id)">导出座位表</el-button>
                    <el-button type="primary" link size="small" @click="copyTripInfo(trip.id)">复制信息</el-button>
                    <el-button type="primary" link size="small" @click="editTrip(trip)">编辑</el-button>
                  </div>
                </div>
              </template>

              <div class="trip-summary">
                <div class="summary-row">
                  <span>出发日期：{{ trip.departDate }}</span>
                </div>
                <div class="summary-row">
                  <span>成人票：{{ trip.summary.adultCount }}张 × {{ trip.adultPrice }}元 = {{ trip.summary.adultCount * trip.adultPrice }}元</span>
                </div>
                <div class="summary-row">
                  <span>儿童票：{{ trip.summary.childCount }}张 × {{ trip.childPrice }}元 = {{ trip.summary.childCount * trip.childPrice }}元</span>
                </div>
                <el-divider />
                <div class="summary-row">
                  <span>票价小计：{{ trip.summary.ticketTotal }}元</span>
                </div>
                <div class="summary-row">
                  <span>购票服务费：{{ trip.summary.serviceFeeCount || trip.members.length }}张 × {{ config?.serviceFee || 10 }}元 = {{ trip.summary.serviceFee }}元</span>
                </div>
                <div class="summary-row">
                  <span>退票服务费：{{ trip.summary.refundCount }}张 × {{ config?.refundServiceFee || 20 }}元 = {{ trip.summary.refundFee }}元</span>
                </div>
                <div class="summary-row">
                  <span>核验费：{{ trip.verifyCount }}次 × {{ config?.foreignIdVerify || 8 }}元 = {{ trip.summary.verifyFee }}元</span>
                </div>
                <el-divider />
                <div class="summary-row total">
                  <span>小计：{{ trip.summary.total }}元</span>
                </div>
              </div>

              <!-- 人员列表 -->
              <div class="members-section">
                <div class="members-header">
                  <span>人员明细 ({{ trip.members.length }}人)</span>
                  <div class="members-actions">
                    <el-input
                      v-model="memberSearchKeyword[trip.id]"
                      placeholder="搜索姓名..."
                      clearable
                      size="small"
                      style="width: 150px; margin-right: 10px;"
                    />
                    <el-button type="primary" size="small" @click="showAddMember(trip.id)">添加</el-button>
                    <el-button type="success" size="small" @click="showImportMember(trip.id)">导入</el-button>
                  </div>
                </div>
                <el-table :data="filterMembers(trip.members, trip.id)" size="small" :row-class-name="(data) => data.row.status === '退票' ? 'refund-row' : ''">
                  <el-table-column prop="name" label="姓名" min-width="120" />
                  <el-table-column prop="ticketType" label="票型" min-width="80" />
                  <el-table-column label="状态" min-width="90">
                    <template #default="{ row }">
                      <el-tag :type="row.status === '退票' ? 'warning' : 'success'" size="small">{{ row.status }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" min-width="180">
                    <template #default="{ row }">
                      <el-button type="primary" link size="small" @click="editMember(row)">编辑</el-button>
                      <el-button v-if="row.status !== '退票'" type="warning" link size="small" @click="refundMember(row)">退票</el-button>
                      <el-button type="danger" link size="small" @click="deleteMember(row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 合并总计 -->
      <el-card class="total-card">
        <template #header>
          <div class="total-header">
            <span>合并总计</span>
            <el-button type="success" size="small" @click="copyTotalInfo">复制团信息</el-button>
          </div>
        </template>

        <div class="total-content">
          <div class="total-row">
            <span>成人票合计：{{ totalSummary.adultCount }}张</span>
          </div>
          <div class="total-row">
            <span>儿童票合计：{{ totalSummary.childCount }}张</span>
          </div>
          <el-divider />
          <div class="total-row">
            <span>票价总计：{{ totalSummary.ticketTotal }}元</span>
          </div>
          <div class="total-row">
            <span>购票服务费总计：{{ totalSummary.serviceFee }}元</span>
          </div>
          <div class="total-row">
            <span>退票服务费总计：{{ totalSummary.refundFee }}元</span>
          </div>
          <div class="total-row">
            <span>核验费总计：{{ totalSummary.verifyFee }}元</span>
          </div>
          <el-divider />
          <div class="total-row grand-total">
            <span>共计：{{ totalSummary.total }}元</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加人员对话框 -->
    <el-dialog v-model="showAddMemberDialog" title="添加人员" width="500px">
      <el-form :model="memberForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="memberForm.name" />
        </el-form-item>
        <el-form-item label="证件类型">
          <el-select v-model="memberForm.idType" style="width: 100%">
            <el-option label="二代" value="二代" />
            <el-option label="外护" value="外护" />
          </el-select>
        </el-form-item>
        <el-form-item label="证件号码">
          <el-input v-model="memberForm.idNumber" />
        </el-form-item>
        <el-form-item label="票型">
          <el-radio-group v-model="memberForm.ticketType" @change="onTicketTypeChange">
            <el-radio value="成人">成人（{{ currentTrip?.adultPrice || 0 }}元）</el-radio>
            <el-radio value="儿童">儿童（{{ currentTrip?.childPrice || 0 }}元）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="票价">
          <el-input-number v-model="memberForm.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车厢">
              <el-input v-model="memberForm.carriage" placeholder="如: 5" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="座位号">
              <el-input v-model="memberForm.seatNo" placeholder="如: 12A" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showAddMemberDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMember">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入人员对话框 -->
    <el-dialog v-model="showImportDialog" title="导入人员" width="500px">
      <el-upload drag :auto-upload="false" :limit="1" accept=".xlsx,.xls" :on-change="handleImportFile">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将 Excel 文件拖到此处，或<em>点击上传</em></div>
      </el-upload>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="importMembers" :loading="importing">导入</el-button>
      </template>
    </el-dialog>

    <!-- 编辑行程对话框 -->
    <el-dialog v-model="showEditTripDialog" title="编辑行程" width="500px">
      <el-form :model="tripForm" label-width="80px">
        <el-form-item label="行程类型">
          <el-radio-group v-model="tripForm.tripType">
            <el-radio value="去程">去程</el-radio>
            <el-radio value="返程">返程</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="车次">
          <el-input v-model="tripForm.trainNo" />
        </el-form-item>
        <el-form-item label="行程">
          <el-input v-model="tripForm.route" />
        </el-form-item>
        <el-form-item label="出发日期">
          <el-date-picker v-model="tripForm.departDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="成人票价">
          <el-input-number v-model="tripForm.adultPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="儿童票价">
          <el-input-number v-model="tripForm.childPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="核验数">
          <el-input-number v-model="tripForm.verifyCount" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditTripDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTrip">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { groupApi, memberApi } from '../api'

const route = useRoute()
const router = useRouter()

const groupName = decodeURIComponent(route.params.groupName)
const trips = ref([])
const totalSummary = ref({})
const config = ref({})
const loading = ref(false)

const showAddMemberDialog = ref(false)
const showImportDialog = ref(false)
const showEditTripDialog = ref(false)
const currentTripId = ref(null)
const importing = ref(false)
const importFile = ref(null)
const editingMember = ref(null)
const memberSearchKeyword = ref({})

const memberForm = reactive({
  name: '',
  idType: '二代',
  idNumber: '',
  ticketType: '成人',
  price: 0,
  carriage: '',
  seatNo: ''
})

const tripForm = reactive({
  tripType: '去程',
  trainNo: '',
  route: '',
  departDate: '',
  adultPrice: 0,
  childPrice: 0,
  verifyCount: 0
})

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await groupApi.getByName(groupName)
    trips.value = data.trips
    totalSummary.value = data.totalSummary
    config.value = data.config
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

// 过滤人员列表
const filterMembers = (members, tripId) => {
  const keyword = memberSearchKeyword.value[tripId]
  if (!keyword || !keyword.trim()) {
    return members
  }
  const search = keyword.toLowerCase()
  return members.filter(m => m.name.toLowerCase().includes(search))
}

// 兼容 HTTP 环境的复制函数
const copyToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    // HTTP 环境下的兼容方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

const copyTripInfo = async (tripId) => {
  const { data } = await groupApi.copyInfo(tripId)
  await copyToClipboard(data.text)
  ElMessage.success('已复制到剪贴板')
}

const copyTotalInfo = async () => {
  let text = `团名：${groupName}\n\n`

  for (const trip of trips.value) {
    text += `【${trip.tripType}】\n`
    text += `车次：${trip.trainNo}\n`
    text += `行程：${trip.route}\n`
    text += `出发日期：${trip.departDate}\n`
    text += `成人票：${trip.summary.adultCount}张 × ${trip.adultPrice}元 = ${trip.summary.adultCount * trip.adultPrice}元\n`
    text += `儿童票：${trip.summary.childCount}张 × ${trip.childPrice}元 = ${trip.summary.childCount * trip.childPrice}元\n`
    text += `────────────────────\n`
    text += `票价小计：${trip.summary.ticketTotal}元\n`
    text += `购票服务费：${trip.summary.serviceFee}元\n`
    text += `退票服务费：${trip.summary.refundFee}元\n`
    text += `核验费：${trip.summary.verifyFee}元\n`
    text += `小计：${trip.summary.total}元\n\n`
  }

  text += `═══════════════════\n`
  text += `【合并总计】\n`
  text += `票价总计：${totalSummary.value.ticketTotal}元\n`
  text += `购票服务费：${totalSummary.value.serviceFee}元\n`
  text += `退票服务费：${totalSummary.value.refundFee}元\n`
  text += `核验费：${totalSummary.value.verifyFee}元\n`
  text += `────────────────────\n`
  text += `共计：${totalSummary.value.total}元`

  await copyToClipboard(text)
  ElMessage.success('已复制团信息到剪贴板')
}

const editTrip = (trip) => {
  currentTripId.value = trip.id
  Object.assign(tripForm, {
    tripType: trip.tripType,
    trainNo: trip.trainNo,
    route: trip.route,
    departDate: trip.departDate,
    adultPrice: trip.adultPrice,
    childPrice: trip.childPrice,
    verifyCount: trip.verifyCount
  })
  showEditTripDialog.value = true
}

const exportSeats = async (tripId) => {
  try {
    const response = await groupApi.exportSeats(tripId)

    // 调试：打印响应头信息
    console.log('导出座位表 - 响应头:', response.headers)

    const contentDisposition = response.headers['content-disposition']
    console.log('Content-Disposition:', contentDisposition)

    let fileName = '座位表.xlsx' // 默认文件名

    if (contentDisposition) {
      // 尝试多种格式匹配文件名
      let match = null

      // 方式1: filename*=UTF-8''编码文件名 (RFC 5987 标准)
      match = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/i)
      if (match) {
        console.log('匹配到 filename*=UTF-8 格式:', match[1])
        fileName = decodeURIComponent(match[1])
      } else {
        // 方式2: filename="文件名" 或 filename=文件名
        match = contentDisposition.match(/filename="?([^";]+)"?(?:;|$)/i)
        if (match) {
          console.log('匹配到 filename 格式:', match[1])
          // 尝试解码，如果失败则直接使用
          try {
            fileName = decodeURIComponent(match[1])
          } catch {
            fileName = match[1]
          }
        }
      }
    }

    console.log('解析后的文件名:', fileName)

    // 创建 Blob 并下载
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success(`已导出: ${fileName}`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + (error.message || '未知错误'))
  }
}

const saveTrip = async () => {
  await groupApi.update(currentTripId.value, tripForm)
  ElMessage.success('保存成功')
  showEditTripDialog.value = false
  loadData()
}

const showAddMember = (tripId) => {
  currentTripId.value = tripId
  editingMember.value = null
  // 获取当前行程的票价
  const trip = trips.value.find(t => t.id === tripId)
  Object.assign(memberForm, {
    name: '',
    idType: '二代',
    idNumber: '',
    ticketType: '成人',
    price: trip?.adultPrice || 0,
    carriage: '',
    seatNo: ''
  })
  showAddMemberDialog.value = true
}

const editMember = (member) => {
  editingMember.value = member
  currentTripId.value = member.groupId
  Object.assign(memberForm, member)
  showAddMemberDialog.value = true
}

// 票型变化时自动填充对应票价
const onTicketTypeChange = (type) => {
  const trip = currentTrip.value
  if (trip) {
    memberForm.price = type === '成人' ? trip.adultPrice : trip.childPrice
  }
}

// 获取当前行程
const currentTrip = computed(() => {
  return trips.value.find(t => t.id === currentTripId.value)
})

const saveMember = async () => {
  console.log('保存成员数据:', memberForm)
  if (editingMember.value) {
    await memberApi.update(editingMember.value.id, memberForm)
    ElMessage.success('修改成功')
  } else {
    await memberApi.create(currentTripId.value, memberForm)
    ElMessage.success('添加成功')
  }
  showAddMemberDialog.value = false
  loadData()
}

const refundMember = async (member) => {
  await ElMessageBox.confirm('确定标记为退票？', '提示', { type: 'warning' })
  await memberApi.refund(member.id)
  ElMessage.success('已标记退票')
  loadData()
}

const deleteMember = async (member) => {
  await ElMessageBox.confirm('确定删除该人员？', '提示', { type: 'warning' })
  await memberApi.delete(member.id)
  ElMessage.success('删除成功')
  loadData()
}

const showImportMember = (tripId) => {
  currentTripId.value = tripId
  importFile.value = null
  showImportDialog.value = true
}

const handleImportFile = (file) => {
  importFile.value = file.raw
}

const importMembers = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    const { data } = await memberApi.import(currentTripId.value, formData)
    ElMessage.success(`成功导入 ${data.imported} 人`)
    showImportDialog.value = false
    loadData()
  } finally {
    importing.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.group-detail {
  max-width: 1600px;
  margin: 0 auto;
  padding: 30px;
}

.group-name-header {
  font-size: 20px;
  font-weight: bold;
}

.trips-section {
  margin: 25px 0;
}

.trip-card {
  margin-bottom: 24px;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trip-info {
  margin-left: 10px;
  color: #606266;
}

.trip-summary {
  font-size: 15px;
}

.summary-row {
  padding: 8px 0;
}

.summary-row.total {
  font-weight: bold;
  color: #409EFF;
  font-size: 16px;
}

.members-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
  font-size: 16px;
}

.members-actions {
  display: flex;
  align-items: center;
}

.members-section :deep(.el-table) {
  font-size: 14px;
}

.members-section :deep(.el-table td) {
  padding: 10px 0;
}

.members-section :deep(.el-button) {
  font-size: 14px;
  padding: 5px 10px;
  margin: 0 3px;
}

.total-card {
  background: #f5f7fa;
}

.total-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-content {
  font-size: 16px;
}

.total-row {
  padding: 10px 0;
}

.total-row.grand-total {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}
</style>

<style>
.el-table .refund-row {
  background-color: #fdf6ec !important;
}
</style>
