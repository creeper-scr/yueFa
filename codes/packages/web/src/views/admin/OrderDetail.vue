<template>
  <div class="order-detail-page">
    <van-nav-bar title="订单详情" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="page-loading" />

    <template v-else-if="order">
      <!-- 状态卡片 -->
      <div :class="['status-card', `status-${order.status}`]">
        <div class="status-icon">
          <van-icon :name="statusIcon" size="32" />
        </div>
        <div class="status-info">
          <div class="status-label">{{ statusLabel }}</div>
          <div class="status-desc">{{ statusDesc }}</div>
        </div>
      </div>

      <!-- 客户信息 -->
      <van-cell-group inset title="客户信息">
        <van-cell title="客户称呼" :value="order.customer_name || '-'" />
        <van-cell title="联系方式" :value="order.customer_contact || '-'" is-link @click="copyContact" />
        <van-cell title="头围" :value="order.head_circumference || '-'" />
      </van-cell-group>

      <!-- 订单信息 -->
      <van-cell-group inset title="订单信息">
        <van-cell title="角色" :value="order.character_name" />
        <van-cell title="作品" :value="order.source_work || '-'" />
        <van-cell title="交付日期" :value="order.deadline || '-'" />
        <van-cell title="成交价" :value="order.price ? `¥${order.price}` : '-'" />
        <van-cell title="定金" :value="order.deposit ? `¥${order.deposit}` : '-'" />
      </van-cell-group>

      <!-- 人设图 -->
      <van-cell-group inset title="人设图" v-if="order.reference_images?.length">
        <div class="reference-images">
          <van-image
            v-for="(img, index) in order.reference_images"
            :key="index"
            :src="img"
            fit="cover"
            width="80"
            height="80"
            @click="previewImage(index)"
          />
        </div>
      </van-cell-group>

      <!-- 制作要求 -->
      <van-cell-group inset title="制作要求" v-if="order.requirements">
        <div class="requirements">{{ order.requirements }}</div>
      </van-cell-group>

      <!-- 备注记录 -->
      <van-cell-group inset title="备注记录">
        <div class="notes-list" v-if="order.notes?.length">
          <div v-for="note in order.notes" :key="note.id" class="note-item">
            <div class="note-content">{{ note.content }}</div>
            <div class="note-time">{{ formatTime(note.created_at) }}</div>
          </div>
        </div>
        <van-empty v-else description="暂无备注" :image-size="60" />
        <div class="add-note">
          <van-field
            v-model="newNote"
            placeholder="添加备注..."
            type="textarea"
            rows="1"
            autosize
          >
            <template #button>
              <van-button size="small" type="primary" @click="addNote" :loading="addingNote">
                添加
              </van-button>
            </template>
          </van-field>
        </div>
      </van-cell-group>

      <!-- 操作按钮 -->
      <div class="action-bar" v-if="nextAction">
        <van-button type="primary" block round @click="changeStatus">
          {{ nextAction.label }}
        </van-button>
      </div>
    </template>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showPreview"
      :images="order?.reference_images || []"
      :start-position="previewIndex"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { ordersApi } from '@/api'

const router = useRouter()
const route = useRoute()
const orderId = route.params.id

const loading = ref(true)
const order = ref(null)
const newNote = ref('')
const addingNote = ref(false)
const showPreview = ref(false)
const previewIndex = ref(0)

const STATUS_CONFIG = {
  pending_deposit: {
    icon: 'clock-o',
    label: '待定金',
    desc: '等待客户支付定金',
    nextStatus: 'in_production',
    nextLabel: '确认收到定金'
  },
  in_production: {
    icon: 'brush-o',
    label: '制作中',
    desc: '正在制作中，请按时完成',
    nextStatus: 'pending_ship',
    nextLabel: '标记制作完成'
  },
  pending_ship: {
    icon: 'logistics',
    label: '待发货',
    desc: '制作完成，准备发货',
    nextStatus: 'completed',
    nextLabel: '确认已发货'
  },
  completed: {
    icon: 'passed',
    label: '已完成',
    desc: '订单已完成',
    nextStatus: null,
    nextLabel: null
  }
}

const statusConfig = computed(() => STATUS_CONFIG[order.value?.status] || {})
const statusIcon = computed(() => statusConfig.value.icon || 'info-o')
const statusLabel = computed(() => statusConfig.value.label || '未知状态')
const statusDesc = computed(() => statusConfig.value.desc || '')

const nextAction = computed(() => {
  const config = statusConfig.value
  if (!config.nextStatus) return null
  return {
    status: config.nextStatus,
    label: config.nextLabel
  }
})

const fetchOrder = async () => {
  loading.value = true
  try {
    const res = await ordersApi.getDetail(orderId)
    if (res.code === 0) {
      order.value = res.data
    }
  } catch (error) {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const copyContact = async () => {
  if (!order.value?.customer_contact) return
  try {
    await navigator.clipboard.writeText(order.value.customer_contact)
    showSuccessToast('已复制')
  } catch {
    showToast('复制失败')
  }
}

const previewImage = (index) => {
  previewIndex.value = index
  showPreview.value = true
}

const addNote = async () => {
  if (!newNote.value.trim()) return
  addingNote.value = true
  try {
    const res = await ordersApi.addNote(orderId, newNote.value)
    if (res.code === 0) {
      order.value = res.data
      newNote.value = ''
      showSuccessToast('备注已添加')
    }
  } catch (error) {
    showToast(error.message || '添加失败')
  } finally {
    addingNote.value = false
  }
}

const changeStatus = async () => {
  if (!nextAction.value) return
  try {
    const res = await ordersApi.updateStatus(orderId, nextAction.value.status)
    if (res.code === 0) {
      order.value = res.data
      showSuccessToast('状态已更新')
    }
  } catch (error) {
    showToast(error.message || '更新失败')
  }
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.order-detail-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 100px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 20px;
  margin: 12px;
  border-radius: 12px;
  color: #fff;
}

.status-card.status-pending_deposit {
  background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
}

.status-card.status-in_production {
  background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%);
}

.status-card.status-pending_ship {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.status-card.status-completed {
  background: linear-gradient(135deg, #78909c 0%, #546e7a 100%);
}

.status-icon {
  margin-right: 16px;
}

.status-label {
  font-size: 18px;
  font-weight: 600;
}

.status-desc {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}

.reference-images {
  display: flex;
  gap: 8px;
  padding: 12px;
  flex-wrap: wrap;
}

.requirements {
  padding: 12px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.notes-list {
  padding: 12px;
}

.note-item {
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.note-item:last-child {
  border-bottom: none;
}

.note-content {
  font-size: 14px;
  color: #333;
}

.note-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.add-note {
  padding: 12px;
  border-top: 1px solid #f5f5f5;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}
</style>
