<template>
  <div class="config-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Setting /></el-icon>
        费用配置
      </h2>
      <p class="page-desc">设置系统默认费用标准，将应用于所有旅游团的费用计算</p>
    </div>

    <!-- 配置卡片 -->
    <div class="config-grid">
      <div class="config-card">
        <div class="card-icon card-icon-primary">
          <el-icon><Ticket /></el-icon>
        </div>
        <div class="card-content">
          <label class="card-label">购票服务费</label>
          <div class="card-input-group">
            <input
              type="number"
              v-model.number="form.serviceFee"
              min="0"
              step="0.1"
              class="card-input"
            >
            <span class="card-unit">元/张</span>
          </div>
          <p class="card-desc">每张火车票收取的服务费用</p>
        </div>
      </div>

      <div class="config-card">
        <div class="card-icon card-icon-warning">
          <el-icon><RefreshLeft /></el-icon>
        </div>
        <div class="card-content">
          <label class="card-label">退票服务费</label>
          <div class="card-input-group">
            <input
              type="number"
              v-model.number="form.refundServiceFee"
              min="0"
              step="0.1"
              class="card-input"
            >
            <span class="card-unit">元/张</span>
          </div>
          <p class="card-desc">每张退票收取的服务费用</p>
        </div>
      </div>

      <div class="config-card">
        <div class="card-icon card-icon-info">
          <el-icon><DocumentChecked /></el-icon>
        </div>
        <div class="card-content">
          <label class="card-label">外国证件核验费</label>
          <div class="card-input-group">
            <input
              type="number"
              v-model.number="form.foreignIdVerify"
              min="0"
              step="0.1"
              class="card-input"
            >
            <span class="card-unit">元/次</span>
          </div>
          <p class="card-desc">外籍乘客证件核验费用</p>
        </div>
      </div>

      <div class="config-card">
        <div class="card-icon card-icon-success">
          <el-icon><Document /></el-icon>
        </div>
        <div class="card-content">
          <label class="card-label">电子发票费</label>
          <div class="card-input-group">
            <input
              type="number"
              v-model.number="form.electronicInvoice"
              min="0"
              step="0.1"
              class="card-input"
            >
            <span class="card-unit">元/次</span>
          </div>
          <p class="card-desc">开具电子发票的服务费用</p>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-section">
      <button class="btn btn-primary btn-lg" @click="saveConfig">
        <el-icon><Check /></el-icon>
        保存配置
      </button>
    </div>

    <!-- 说明卡片 -->
    <div class="info-card">
      <div class="info-header">
        <el-icon><InfoFilled /></el-icon>
        <span>费用说明</span>
      </div>
      <div class="info-content">
        <ul>
          <li><strong>购票服务费</strong>：正常购票时，按人数收取的服务费用</li>
          <li><strong>退票服务费</strong>：乘客退票时收取的手续费用</li>
          <li><strong>外国证件核验费</strong>：外籍乘客使用护照等证件购票时的核验费用</li>
          <li><strong>电子发票费</strong>：开具电子发票时的服务费用</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Ticket, RefreshLeft, DocumentChecked, Document, Check, InfoFilled } from '@element-plus/icons-vue'
import { configApi } from '../api'

const form = reactive({
  serviceFee: 10,
  refundServiceFee: 20,
  foreignIdVerify: 8,
  electronicInvoice: 3
})

const loadConfig = async () => {
  const { data } = await configApi.get()
  Object.assign(form, data)
}

const saveConfig = async () => {
  await configApi.update(form)
  ElMessage.success('保存成功')
}

onMounted(loadConfig)
</script>

<style scoped>
.config-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
  color: #374151;
}

/* 页面标题 */
.page-header {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 6px 0;
}

.page-title .el-icon { color: #0d9488; }
.page-desc { font-size: 13px; color: #6b7280; margin: 0; }

/* 配置网格 */
.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.config-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
  display: flex;
  gap: 16px;
  transition: all 0.2s;
}

.config-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(13, 148, 136, 0.12);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.card-icon-primary { background: #ccfbf1; color: #0d9488; }
.card-icon-warning { background: #fef3c7; color: #d97706; }
.card-icon-info { background: #e0f2fe; color: #0284c7; }
.card-icon-success { background: #dcfce7; color: #16a34a; }

.card-content { flex: 1; min-width: 0; }
.card-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 10px; }
.card-input-group { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }

.card-input {
  width: 100px;
  padding: 10px 14px;
  background: #f0fdfa;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  outline: none;
}

.card-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1); }
.card-unit { font-size: 13px; color: #6b7280; }
.card-desc { font-size: 12px; color: #9ca3af; margin: 0; }

/* 保存按钮 */
.save-section { display: flex; justify-content: center; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-lg { padding: 14px 40px; font-size: 15px; }
.btn-primary { background: #0d9488; color: white; }
.btn-primary:hover { background: #0f766e; box-shadow: 0 6px 20px rgba(13, 148, 136, 0.25); }

/* 说明卡片 */
.info-card { background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 16px; }
.info-header { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #92400e; margin-bottom: 10px; }
.info-content ul { margin: 0; padding-left: 18px; }
.info-content li { font-size: 12px; color: #78350f; margin-bottom: 6px; line-height: 1.5; }
.info-content li:last-child { margin-bottom: 0; }

/* 响应式 */
@media (max-width: 768px) {
  .config-grid { grid-template-columns: 1fr; gap: 12px; }
  .config-card { padding: 16px; }
}

@media (max-width: 480px) {
  .config-card { flex-direction: column; text-align: center; padding: 14px; gap: 12px; }
  .card-icon { margin: 0 auto; }
  .card-input-group { justify-content: center; }
  .card-input { width: 90px; }
  .btn-lg { padding: 12px 32px; width: 100%; }
}
</style>
