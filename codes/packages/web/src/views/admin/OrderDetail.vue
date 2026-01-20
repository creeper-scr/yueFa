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
        <!-- 死线提醒 -->
        <div v-if="deadlineDays !== null" :class="['deadline-badge', deadlineClass]">
          {{ deadlineDays <= 0 ? '已到期' : `${deadlineDays}天后到期` }}
        </div>
      </div>

      <!-- 客户信息 -->
      <van-cell-group inset title="客户信息">
        <van-cell title="客户称呼" :value="order.customer_name || '-'" />
        <van-cell title="联系方式" :value="order.customer_contact || '-'" is-link @click="copyContact" />
        <van-cell title="头围" :value="order.head_circumference || '-'" />
        <van-cell v-if="order.head_notes" title="头型备注" :value="order.head_notes" />
      </van-cell-group>

      <!-- 订单信息 -->
      <van-cell-group inset title="订单信息">
        <van-cell title="角色" :value="order.character_name" />
        <van-cell title="作品" :value="order.source_work || '-'" />
        <van-cell title="交付日期" :value="order.deadline || '-'" />
        <van-cell title="成交价" :value="order.price ? `¥${order.price}` : '-'" />
        <van-cell title="定金(20%)">
          <template #value>
            <span>¥{{ order.deposit || 0 }}</span>
            <van-tag v-if="order.deposit_paid_at" type="success" size="small" class="pay-tag">已付</van-tag>
            <van-tag v-else type="warning" size="small" class="pay-tag">待付</van-tag>
          </template>
        </van-cell>
        <van-cell title="尾款(80%)">
          <template #value>
            <span>¥{{ order.balance || 0 }}</span>
            <van-tag v-if="order.balance_paid_at" type="success" size="small" class="pay-tag">已付</van-tag>
            <van-tag v-else type="warning" size="small" class="pay-tag">待付</van-tag>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 毛坯信息 PRD F-03 -->
      <van-cell-group inset title="毛坯信息">
        <van-cell title="毛坯来源" :value="order.wig_source === 'stylist_buys' ? '毛娘代购' : '客户寄送'" />
        <van-cell v-if="order.wig_source === 'client_sends'" title="毛坯状态">
          <template #value>
            <van-tag v-if="order.wig_received_at" type="success">已收到</van-tag>
            <van-tag v-else type="warning">等待中</van-tag>
          </template>
        </van-cell>
        <van-cell v-if="order.wig_tracking_no" title="快递单号" :value="order.wig_tracking_no" />
        <van-cell v-if="order.wig_received_at" title="收货时间" :value="formatTime(order.wig_received_at)" />
      </van-cell-group>

      <!-- 发货信息 -->
      <van-cell-group v-if="order.shipped_at || order.status === 'shipped' || order.status === 'completed'" inset title="发货信息">
        <van-cell title="快递公司" :value="order.shipping_company || '-'" />
        <van-cell title="快递单号" :value="order.shipping_no || '-'" />
        <van-cell v-if="order.shipped_at" title="发货时间" :value="formatTime(order.shipped_at)" />
      </van-cell-group>

      <!-- 验收信息 -->
      <van-cell-group inset title="验收信息">
        <van-cell v-if="review" title="验收状态">
          <template #value>
            <van-tag v-if="review.is_approved" type="success">已通过</van-tag>
            <van-tag v-else type="primary">等待确认</van-tag>
          </template>
        </van-cell>
        <van-cell v-if="review" title="修改次数" :value="`${review.revision_count}/${review.max_revisions}`" />
        <van-cell
          is-link
          @click="goToReview"
        >
          <template #title>
            <span>{{ review ? '查看验收' : '创建验收' }}</span>
          </template>
        </van-cell>
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

      <!-- 特殊要求 -->
      <van-cell-group inset title="特殊要求" v-if="order.special_requirements">
        <div class="requirements">{{ order.special_requirements }}</div>
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
      <div class="action-bar" v-if="actions.length > 0">
        <van-button
          v-for="action in actions"
          :key="action.key"
          :type="action.primary ? 'primary' : 'default'"
          block
          round
          class="action-btn"
          @click="handleAction(action.key)"
        >
          {{ action.label }}
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
import { showToast, showSuccessToast, showFailToast, showConfirmDialog } from 'vant'
import { ordersApi, reviewsApi } from '@/api'

const router = useRouter()
const route = useRoute()
const orderId = route.params.id

const loading = ref(true)
const order = ref(null)
const review = ref(null)
const newNote = ref('')
const addingNote = ref(false)
const showPreview = ref(false)
const previewIndex = ref(0)

// PRD 2.0 - 9状态配置
const STATUS_CONFIG = {
  pending_deposit: {
    icon: 'clock-o',
    label: '待定金',
    desc: '等待客户支付定金'
  },
  awaiting_wig_base: {
    icon: 'logistics',
    label: '等毛坯',
    desc: '等待客户寄送毛坯'
  },
  queued: {
    icon: 'orders-o',
    label: '排单中',
    desc: '已进入制作队列'
  },
  in_progress: {
    icon: 'brush-o',
    label: '制作中',
    desc: '正在制作中，请按时完成'
  },
  in_review: {
    icon: 'eye-o',
    label: '验收中',
    desc: '等待客户验收确认'
  },
  pending_balance: {
    icon: 'gold-coin-o',
    label: '待尾款',
    desc: '验收通过，等待尾款'
  },
  shipped: {
    icon: 'logistics',
    label: '已发货',
    desc: '已发货，等待客户收货'
  },
  completed: {
    icon: 'passed',
    label: '已完成',
    desc: '订单已完成'
  }
}

// 状态对应的操作
const STATUS_ACTIONS = {
  pending_deposit: [{ key: 'confirm_deposit', label: '确认定金到账', primary: true }],
  awaiting_wig_base: [{ key: 'confirm_wig', label: '确认毛坯收货', primary: true }],
  queued: [{ key: 'start', label: '开始制作', primary: true }],
  in_progress: [{ key: 'create_review', label: '创建验收', primary: true }],
  in_review: [{ key: 'view_review', label: '查看验收', primary: false }],
  pending_balance: [
    { key: 'confirm_balance', label: '确认尾款到账', primary: true },
    { key: 'ship', label: '发货', primary: false }
  ],
  shipped: [{ key: 'complete', label: '确认收货完成', primary: true }],
  completed: []
}

const statusConfig = computed(() => STATUS_CONFIG[order.value?.status] || {})
const statusIcon = computed(() => statusConfig.value.icon || 'info-o')
const statusLabel = computed(() => statusConfig.value.label || '未知状态')
const statusDesc = computed(() => statusConfig.value.desc || '')

const actions = computed(() => {
  return STATUS_ACTIONS[order.value?.status] || []
})

// 计算剩余天数
const deadlineDays = computed(() => {
  if (!order.value?.deadline) return null
  const deadline = new Date(order.value.deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
  return diff
})

const deadlineClass = computed(() => {
  if (deadlineDays.value === null) return ''
  if (deadlineDays.value <= 3) return 'deadline-red'
  if (deadlineDays.value <= 7) return 'deadline-yellow'
  return ''
})

const fetchOrder = async () => {
  loading.value = true
  try {
    const res = await ordersApi.getDetail(orderId)
    if (res.code === 0) {
      order.value = res.data
    }
    // 获取验收信息
    const reviewRes = await reviewsApi.getByOrderId(orderId)
    if (reviewRes.code === 0 && reviewRes.data) {
      review.value = reviewRes.data
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

const goToReview = () => {
  router.push(`/admin/orders/${orderId}/review`)
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

// 处理操作
const handleAction = async (action) => {
  switch (action) {
    case 'confirm_deposit':
      await confirmDeposit()
      break
    case 'confirm_wig':
      await confirmWigReceived()
      break
    case 'start':
      await updateStatus('in_progress')
      break
    case 'create_review':
    case 'view_review':
      goToReview()
      break
    case 'confirm_balance':
      await confirmBalance()
      break
    case 'ship':
      showToast('请在订单列表页操作发货')
      break
    case 'complete':
      await completeOrder()
      break
  }
}

const confirmDeposit = async () => {
  try {
    await showConfirmDialog({
      title: '确认定金',
      message: '确认已收到客户定金？'
    })
    await ordersApi.confirmDeposit(orderId)
    showSuccessToast('定金已确认')
    fetchOrder()
  } catch {
    // 用户取消
  }
}

const confirmWigReceived = async () => {
  try {
    await showConfirmDialog({
      title: '确认毛坯',
      message: '确认已收到客户寄送的毛坯？'
    })
    await ordersApi.confirmWigReceived(orderId)
    showSuccessToast('毛坯已确认收货')
    fetchOrder()
  } catch {
    // 用户取消
  }
}

const confirmBalance = async () => {
  try {
    await showConfirmDialog({
      title: '确认尾款',
      message: '确认已收到客户尾款？'
    })
    await ordersApi.confirmBalance(orderId)
    showSuccessToast('尾款已确认')
    fetchOrder()
  } catch {
    // 用户取消
  }
}

const updateStatus = async (status) => {
  try {
    await ordersApi.updateStatus(orderId, status)
    showSuccessToast('状态已更新')
    fetchOrder()
  } catch (error) {
    showFailToast(error.message || '更新失败')
  }
}

const completeOrder = async () => {
  try {
    await showConfirmDialog({
      title: '确认完成',
      message: '确认客户已收货，订单完成？'
    })
    await ordersApi.complete(orderId)
    showSuccessToast('订单已完成')
    fetchOrder()
  } catch {
    // 用户取消
  }
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
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
  position: relative;
}

.status-card.status-pending_deposit {
  background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
}

.status-card.status-awaiting_wig_base {
  background: linear-gradient(135deg, #7e57c2 0%, #5e35b1 100%);
}

.status-card.status-queued {
  background: linear-gradient(135deg, #26c6da 0%, #00acc1 100%);
}

.status-card.status-in_progress {
  background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%);
}

.status-card.status-in_review {
  background: linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%);
}

.status-card.status-pending_balance {
  background: linear-gradient(135deg, #ffa726 0%, #f57c00 100%);
}

.status-card.status-shipped {
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

.deadline-badge {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.deadline-badge.deadline-red {
  background: #ee0a24;
}

.deadline-badge.deadline-yellow {
  background: #ff976a;
}

.pay-tag {
  margin-left: 8px;
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  margin: 0;
}
</style>
