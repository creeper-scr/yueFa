<template>
  <div class="order-card" @click="handleClick">
    <div class="card-header">
      <div class="header-left">
        <span class="customer-name">{{ order.customer_name || '未知客户' }}</span>
        <!-- 毛坯状态图标 PRD UI/UX -->
        <van-icon
          v-if="showWigIcon"
          :name="wigIconConfig.icon"
          :color="wigIconConfig.color"
          class="wig-icon"
        />
      </div>
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
        <div class="meta-item" v-if="order.deadline" :class="deadlineAlertClass">
          <van-icon name="clock-o" />
          <span>{{ formatDate(order.deadline) }}</span>
          <span v-if="daysLeft !== null" class="days-left">
            ({{ daysLeft <= 0 ? '已到期' : `${daysLeft}天` }})
          </span>
        </div>
        <div class="meta-item" v-if="order.price">
          <van-icon name="gold-coin-o" />
          <span>¥{{ order.price }}</span>
        </div>
        <!-- 毛坯来源 -->
        <div class="meta-item" v-if="order.wig_source">
          <van-icon name="gift-o" />
          <span>{{ order.wig_source === 'client_sends' ? '客户寄' : '代购' }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer" v-if="showActions && availableActions.length > 0">
      <van-button
        v-for="action in availableActions"
        :key="action.action"
        size="small"
        :type="action.type"
        @click.stop="handleAction(action)"
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

// PRD 2.0 状态配置 (9个状态)
const STATUS_MAP = {
  pending_quote: { label: '待报价', type: 'warning' },
  pending_deposit: { label: '待定金', type: 'warning' },
  awaiting_wig_base: { label: '等毛坯', type: 'primary' },
  queued: { label: '排单中', type: 'primary' },
  in_progress: { label: '制作中', type: 'primary' },
  in_review: { label: '验收中', type: 'success' },
  pending_balance: { label: '待尾款', type: 'warning' },
  shipped: { label: '已发货', type: 'success' },
  completed: { label: '已完成', type: 'default' }
}

// 状态流转动作
const STATUS_ACTIONS = {
  pending_quote: [{ action: 'quote', label: '去报价', type: 'primary' }],
  pending_deposit: [{ action: 'confirm_deposit', label: '确认定金', type: 'primary' }],
  awaiting_wig_base: [{ action: 'confirm_wig', label: '确认收货', type: 'primary' }],
  queued: [{ action: 'start', label: '开始制作', type: 'primary' }],
  in_progress: [{ action: 'create_review', label: '提交验收', type: 'success' }],
  in_review: [{ action: 'view_review', label: '查看验收', type: 'primary' }],
  pending_balance: [
    { action: 'confirm_balance', label: '确认尾款', type: 'primary' },
    { action: 'ship', label: '发货', type: 'success' }
  ],
  shipped: [{ action: 'complete', label: '确认完成', type: 'success' }],
  completed: []
}

const statusConfig = computed(() => {
  return STATUS_MAP[props.order.status] || { label: '未知', type: 'default' }
})

const availableActions = computed(() => {
  return STATUS_ACTIONS[props.order.status] || []
})

// 毛坯图标配置
const showWigIcon = computed(() => {
  return props.order.wig_source === 'client_sends' &&
    ['pending_deposit', 'awaiting_wig_base'].includes(props.order.status)
})

const wigIconConfig = computed(() => {
  if (props.order.status === 'awaiting_wig_base') {
    return { icon: 'gift-o', color: '#ff976a' } // 等待中
  }
  return { icon: 'gift', color: '#07c160' } // 已收到
})

// 死线预警计算 (PRD B-02)
const daysLeft = computed(() => {
  if (!props.order.deadline) return null
  const deadline = new Date(props.order.deadline)
  const now = new Date()
  const diffTime = deadline - now
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const deadlineAlertClass = computed(() => {
  if (daysLeft.value === null) return ''
  if (daysLeft.value <= 3) return 'deadline-red'
  if (daysLeft.value <= 7) return 'deadline-yellow'
  return ''
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const handleClick = () => {
  emit('click', props.order)
}

const handleAction = (action) => {
  emit('action', { order: props.order, ...action })
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

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.customer-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.wig-icon {
  font-size: 16px;
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
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.days-left {
  color: inherit;
}

.deadline-yellow {
  color: #ff976a;
  font-weight: 500;
}

.deadline-red {
  color: #ee0a24;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}
</style>
