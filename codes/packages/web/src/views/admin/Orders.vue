<template>
  <div class="orders-page">
    <van-nav-bar title="订单管理" />

    <!-- 状态统计 -->
    <div class="status-bar">
      <div
        v-for="item in statusList"
        :key="item.value"
        :class="['status-item', { active: currentStatus === item.value }]"
        @click="currentStatus = item.value"
      >
        <span class="count">{{ statusCount[item.value] || 0 }}</span>
        <span class="label">{{ item.label }}</span>
      </div>
    </div>

    <!-- 询价通知 -->
    <van-notice-bar
      v-if="newInquiryCount > 0"
      mode="link"
      left-icon="bell"
      @click="showInquiries = true"
    >
      您有 {{ newInquiryCount }} 条新询价待处理
    </van-notice-bar>

    <!-- 订单列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <van-empty v-if="!loading && orders.length === 0" description="暂无订单" />
        <OrderCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
          :show-actions="true"
          @click="goToDetail"
          @action="handleStatusChange"
        />
      </van-list>
    </van-pull-refresh>

    <!-- 询价弹窗 -->
    <van-popup
      v-model:show="showInquiries"
      position="bottom"
      round
      :style="{ height: '70%' }"
    >
      <div class="inquiry-popup">
        <van-nav-bar title="新询价" left-arrow @click-left="showInquiries = false" />
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
              <p><strong>预算:</strong> {{ inquiry.budget_range || '未填写' }}</p>
              <p v-if="inquiry.requirements"><strong>要求:</strong> {{ inquiry.requirements }}</p>
            </div>
            <div class="inquiry-actions">
              <van-button size="small" @click="rejectInquiry(inquiry)">拒绝</van-button>
              <van-button size="small" type="primary" @click="convertInquiry(inquiry)">
                转为订单
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 转换订单弹窗 -->
    <van-dialog
      v-model:show="showConvertDialog"
      title="转为订单"
      show-cancel-button
      :before-close="handleConvertClose"
    >
      <van-form>
        <van-cell-group>
          <van-field v-model="convertForm.price" label="价格" type="number" placeholder="成交价格" />
          <van-field v-model="convertForm.deposit" label="定金" type="number" placeholder="定金金额" />
          <van-field
            v-model="convertForm.deadline"
            label="交付日期"
            placeholder="选择交付日期"
            readonly
            is-link
            @click="showDatePicker = true"
          />
        </van-cell-group>
      </van-form>
    </van-dialog>

    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="selectedDate"
        :min-date="new Date()"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <AdminTabbar />
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { ordersApi, inquiriesApi } from '@/api'
import OrderCard from '@/components/OrderCard.vue'
import AdminTabbar from '@/components/AdminTabbar.vue'

const router = useRouter()

const statusList = [
  { value: '', label: '全部' },
  { value: 'pending_deposit', label: '待定金' },
  { value: 'in_production', label: '制作中' },
  { value: 'pending_ship', label: '待发货' },
  { value: 'completed', label: '已完成' }
]

const currentStatus = ref('')
const orders = ref([])
const statusCount = ref({})
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)

const showInquiries = ref(false)
const inquiries = ref([])
const newInquiryCount = ref(0)

const showConvertDialog = ref(false)
const convertingInquiry = ref(null)
const convertForm = reactive({
  price: '',
  deposit: '',
  deadline: ''
})

const showDatePicker = ref(false)
const selectedDate = ref([])

// 监听状态变化，重新加载
watch(currentStatus, () => {
  orders.value = []
  page.value = 1
  finished.value = false
  loadMore()
})

const loadMore = async () => {
  if (loading.value) return
  loading.value = true

  try {
    const res = await ordersApi.getList({
      status: currentStatus.value || undefined,
      page: page.value,
      limit: 20
    })

    if (res.code === 0) {
      const { list, pagination, statusCount: counts } = res.data

      if (page.value === 1) {
        orders.value = list
        statusCount.value = counts
      } else {
        orders.value.push(...list)
      }

      finished.value = list.length < pagination.limit
      page.value++
    }
  } catch (error) {
    showToast('加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => {
  page.value = 1
  finished.value = false
  loadMore()
  fetchInquiries()
}

const fetchInquiries = async () => {
  try {
    const res = await inquiriesApi.getList({ status: 'new' })
    if (res.code === 0) {
      inquiries.value = res.data.list || []
      newInquiryCount.value = res.data.pagination.total
    }
  } catch (error) {
    console.error('Failed to fetch inquiries', error)
  }
}

const goToDetail = (order) => {
  router.push(`/admin/orders/${order.id}`)
}

const handleStatusChange = async ({ order, status }) => {
  try {
    await ordersApi.updateStatus(order.id, status)
    showSuccessToast('状态已更新')
    onRefresh()
  } catch (error) {
    showToast(error.message || '更新失败')
  }
}

const convertInquiry = (inquiry) => {
  convertingInquiry.value = inquiry
  convertForm.price = ''
  convertForm.deposit = ''
  convertForm.deadline = inquiry.expected_deadline || ''
  showConvertDialog.value = true
}

const rejectInquiry = async (inquiry) => {
  try {
    await showConfirmDialog({
      title: '确认拒绝',
      message: '确定要拒绝这个询价吗？'
    })
    await inquiriesApi.reject(inquiry.id)
    showSuccessToast('已拒绝')
    fetchInquiries()
  } catch {
    // 取消
  }
}

const onDateConfirm = ({ selectedValues }) => {
  convertForm.deadline = selectedValues.join('-')
  showDatePicker.value = false
}

const handleConvertClose = async (action) => {
  if (action !== 'confirm') return true

  try {
    await inquiriesApi.convert(convertingInquiry.value.id, {
      price: convertForm.price ? parseFloat(convertForm.price) : undefined,
      deposit: convertForm.deposit ? parseFloat(convertForm.deposit) : undefined,
      deadline: convertForm.deadline || undefined
    })
    showSuccessToast('订单创建成功')
    showInquiries.value = false
    fetchInquiries()
    onRefresh()
    return true
  } catch (error) {
    showToast(error.message || '转换失败')
    return false
  }
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadMore()
  fetchInquiries()
})
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.status-bar {
  display: flex;
  background: #fff;
  padding: 12px 0;
  margin-bottom: 8px;
}

.status-item {
  flex: 1;
  text-align: center;
  cursor: pointer;
}

.status-item .count {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.status-item .label {
  font-size: 12px;
  color: #999;
}

.status-item.active .count {
  color: #FF6B6B;
}

.status-item.active .label {
  color: #FF6B6B;
}

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
