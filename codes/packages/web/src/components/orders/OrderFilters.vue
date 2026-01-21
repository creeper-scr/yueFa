<template>
  <div class="status-bar">
    <div
      v-for="item in statusList"
      :key="item.value"
      :class="['status-item', { active: modelValue === item.value }]"
      @click="$emit('update:modelValue', item.value)"
    >
      <span class="count">{{ statusCount[item.value] || 0 }}</span>
      <span class="label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  statusCount: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['update:modelValue'])

const statusList = [
  { value: '', label: '全部' },
  { value: 'pending_deposit', label: '待定金' },
  { value: 'awaiting_wig_base', label: '等毛坯' },
  { value: 'queued', label: '排单中' },
  { value: 'in_progress', label: '制作中' },
  { value: 'in_review', label: '验收中' },
  { value: 'pending_balance', label: '待尾款' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' }
]
</script>

<style scoped>
.status-bar {
  display: flex;
  flex-wrap: wrap;
  background: #fff;
  padding: 12px 8px;
  margin-bottom: 8px;
}

.status-item {
  width: 25%;
  text-align: center;
  cursor: pointer;
  padding: 4px 0;
}

.status-item .count {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.status-item .label {
  font-size: 11px;
  color: #999;
}

.status-item.active .count {
  color: #FF6B6B;
}

.status-item.active .label {
  color: #FF6B6B;
}
</style>
