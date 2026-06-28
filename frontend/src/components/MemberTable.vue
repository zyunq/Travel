<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>人员明细</span>
        <div>
          <el-button type="primary" size="small" @click="$emit('add')">添加人员</el-button>
          <el-button type="success" size="small" @click="$emit('import')">批量导入</el-button>
        </div>
      </div>
    </template>

    <el-table :data="members" stripe style="width: 100%" :row-class-name="tableRowClassName">
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="idType" label="证件类型" width="80" />
      <el-table-column prop="ticketType" label="票型" width="80" />
      <el-table-column prop="trainNo" label="车次" width="100" />
      <el-table-column label="行程" width="150">
        <template #default="{ row }">{{ row.departStation }}-{{ row.arriveStation }}</template>
      </el-table-column>
      <el-table-column prop="seatClass" label="席别" width="80" />
      <el-table-column label="座位" width="100">
        <template #default="{ row }">{{ row.carriage }}车{{ row.seatNo }}</template>
      </el-table-column>
      <el-table-column prop="price" label="票价" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === '退票' ? 'warning' : 'success'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发票" width="60">
        <template #default="{ row }">{{ row.needInvoice ? '✓' : '✗' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="$emit('edit', row)">编辑</el-button>
          <el-button v-if="row.status !== '退票'" type="warning" link @click="$emit('refund', row)">退票</el-button>
          <el-button type="danger" link @click="$emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
defineProps({
  members: { type: Array, default: () => [] }
})

defineEmits(['add', 'import', 'edit', 'refund', 'delete'])

const tableRowClassName = ({ row }) => {
  return row.status === '退票' ? 'refund-row' : ''
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

<style>
.el-table .refund-row {
  background-color: #fdf6ec !important;
}
</style>
