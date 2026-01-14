<template>
  <div class="order-card" @click="handleClick">
    <div class="card-header">
      <span class="customer-name">{{ order.customer_name || '未知客户' }}</span>
      <van-tag :type="statusConfig.type" size="medium">
        {{ statusConfig.label }}
      </van-tag>
    </div>

    <div class="card-body">
      <div class="character-info">
        <span class="character-name">{{ order.character_name }}</span>
        <span class="source-work" v-if="order.source_work">{{ order.source_work }}</span>
      </div>

      <div class="order-meta">
        <div class="meta-item" v-if="order.deadline">
          <van-icon name="clock-o" />
          <span>{{ formatDate(order.deadline) }}</span>
        </div>
        <div class="meta-item" v-if="order.price">
          <van-icon name="gold-coin-o" />
          <span>¥{{ order.price }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer" v-if="showActions">
      <van-button
        v-for="action in availableActions"
        :key="action.status"
        size="small"
        :type="action.type"
        @click.stop="handleAction(action.status)"
      >
        {{ action.label }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'action'])

// 状态配置
const STATUS_MAP = {
  pending_deposit: { label: '待定金', type: 'warning' },
  in_production: { label: '制作中', type: 'primary' },
  pending_ship: { label: '待发货', type: 'success' },
  completed: { label: '已完成', type: 'default' }
}

// 状态流转动作
const STATUS_ACTIONS = {
  pending_deposit: [{ status: 'in_production', label: '确认定金', type: 'primary' }],
  in_production: [{ status: 'pending_ship', label: '制作完成', type: 'success' }],
  pending_ship: [{ status: 'completed', label: '确认发货', type: 'primary' }],
  completed: []
}

const statusConfig = computed(() => {
  return STATUS_MAP[props.order.status] || { label: '未知', type: 'default' }
})

const availableActions = computed(() => {
  return STATUS_ACTIONS[props.order.status] || []
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const handleClick = () => {
  emit('click', props.order)
}

const handleAction = (status) => {
  emit('action', { order: props.order, status })
}
</script>

<style scoped>
.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.customer-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.card-body {
  margin-bottom: 12px;
}

.character-info {
  margin-bottom: 8px;
}

.character-name {
  font-size: 14px;
  color: #333;
}

.source-work {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.order-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}
</style>
