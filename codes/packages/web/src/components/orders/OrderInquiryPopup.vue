<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    :style="{ height: '70%' }"
    @update:show="$emit('update:show', $event)"
  >
    <div class="inquiry-popup">
      <van-nav-bar title="新询价" left-arrow @click-left="$emit('update:show', false)" />
      <div class="inquiry-list">
        <div
          v-for="inquiry in inquiries"
          :key="inquiry.id"
          class="inquiry-item"
        >
          <div class="inquiry-header">
            <span class="customer">{{ inquiry.customer_name || '匿名客户' }}</span>
            <span class="time">{{ formatTime(inquiry.created_at) }}</span>
          </div>
          <div class="inquiry-content">
            <p><strong>角色:</strong> {{ inquiry.character_name }} - {{ inquiry.source_work }}</p>
            <p><strong>毛坯:</strong> {{ inquiry.wig_source === 'client_sends' ? '客户寄' : '毛娘代购' }}</p>
            <p><strong>预算:</strong> {{ inquiry.budget_range || '未填写' }}</p>
            <p v-if="inquiry.special_requirements">
              <strong>特殊要求:</strong> {{ inquiry.special_requirements }}
            </p>
          </div>
          <div class="inquiry-actions">
            <van-button size="small" @click="$emit('reject', inquiry)">
              拒绝
            </van-button>
            <van-button size="small" type="primary" @click="$emit('convert', inquiry)">
              转为订单
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  inquiries: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:show', 'reject', 'convert'])

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.inquiry-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.inquiry-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.inquiry-item {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.inquiry-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.inquiry-header .customer {
  font-weight: 500;
}

.inquiry-header .time {
  font-size: 12px;
  color: #999;
}

.inquiry-content {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.inquiry-content p {
  margin: 4px 0;
}

.inquiry-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
