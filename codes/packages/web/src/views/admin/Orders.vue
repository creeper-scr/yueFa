<template>
  <div class="orders-page">
    <van-nav-bar title="订单管理" />

    <!-- 死线预警提示 PRD B-02 -->
    <van-notice-bar
      v-if="deadlineAlerts.length > 0"
      mode="link"
      :left-icon="deadlineAlerts.some(a => a.level === 'red') ? 'warning-o' : 'clock-o'"
      :color="deadlineAlerts.some(a => a.level === 'red') ? '#ee0a24' : '#ff976a'"
      :background="deadlineAlerts.some(a => a.level === 'red') ? '#fff1f0' : '#fffbe8'"
      @click="showDeadlineAlert"
    >
      {{ deadlineAlerts.length }}个订单即将到期
    </van-notice-bar>

    <!-- 状态统计 PRD B-01 9状态 -->
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
          @action="handleAction"
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
              <p><strong>毛坯:</strong> {{ inquiry.wig_source === 'client_sends' ? '客户寄' : '毛娘代购' }}</p>
              <p><strong>预算:</strong> {{ inquiry.budget_range || '未填写' }}</p>
              <p v-if="inquiry.special_requirements"><strong>特殊要求:</strong> {{ inquiry.special_requirements }}</p>
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
          <van-cell title="定金" :value="computedDeposit ? `¥${computedDeposit}` : '自动计算(20%)'" />
          <van-cell title="尾款" :value="computedBalance ? `¥${computedBalance}` : '自动计算(80%)'" />
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

    <!-- 确认定金弹窗 -->
    <van-dialog
      v-model:show="showDepositDialog"
      title="确认定金到账"
      show-cancel-button
      @confirm="confirmDeposit"
    >
      <div class="deposit-dialog">
        <p>确认客户已支付定金？</p>
        <van-field name="screenshot" label="支付截图">
          <template #input>
            <van-uploader
              v-model="depositScreenshot"
              :max-count="1"
              :after-read="handleDepositUpload"
            />
          </template>
        </van-field>
      </div>
    </van-dialog>

    <!-- 确认毛坯收货弹窗 -->
    <van-dialog
      v-model:show="showWigDialog"
      title="确认毛坯收货"
      show-cancel-button
      @confirm="confirmWigReceived"
    >
      <div class="wig-dialog">
        <van-field
          v-model="wigTrackingNo"
          label="快递单号"
          placeholder="可选填写快递单号"
        />
      </div>
    </van-dialog>

    <!-- 发货弹窗 -->
    <van-dialog
      v-model:show="showShipDialog"
      title="发货"
      show-cancel-button
      @confirm="handleShip"
    >
      <div class="ship-dialog">
        <van-field
          v-model="shipForm.shipping_company"
          label="快递公司"
          placeholder="如: 顺丰"
        />
        <van-field
          v-model="shipForm.shipping_no"
          label="快递单号"
          placeholder="快递单号"
        />
        <div class="checklist">
          <p class="checklist-title">发货检查:</p>
          <van-checkbox v-model="shipForm.balance_confirmed">已确认尾款到账</van-checkbox>
          <van-checkbox v-model="shipForm.cushioned">已使用防震包装</van-checkbox>
          <van-checkbox v-model="shipForm.insured">已保价</van-checkbox>
        </div>
      </div>
    </van-dialog>

    <AdminTabbar />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast, showConfirmDialog, showDialog } from 'vant'
import { ordersApi, inquiriesApi } from '@/api'
import OrderCard from '@/components/OrderCard.vue'
import AdminTabbar from '@/components/AdminTabbar.vue'

const router = useRouter()

// PRD 2.0 状态列表 (9状态)
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

const currentStatus = ref('')
const orders = ref([])
const statusCount = ref({})
const deadlineAlerts = ref([])
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
  deadline: ''
})

const showDatePicker = ref(false)
const selectedDate = ref([])

// 确认定金相关
const showDepositDialog = ref(false)
const currentOrderForDeposit = ref(null)
const depositScreenshot = ref([])
const depositScreenshotUrl = ref('')

// 确认毛坯相关
const showWigDialog = ref(false)
const currentOrderForWig = ref(null)
const wigTrackingNo = ref('')

// 发货相关
const showShipDialog = ref(false)
const currentOrderForShip = ref(null)
const shipForm = reactive({
  shipping_company: '',
  shipping_no: '',
  balance_confirmed: false,
  cushioned: false,
  insured: false
})

// 自动计算定金和尾款
const computedDeposit = computed(() => {
  if (!convertForm.price) return ''
  return Math.round(parseFloat(convertForm.price) * 0.2 * 100) / 100
})

const computedBalance = computed(() => {
  if (!convertForm.price) return ''
  return Math.round(parseFloat(convertForm.price) * 0.8 * 100) / 100
})

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
      const { list, pagination, statusCount: counts, deadlineAlerts: alerts } = res.data

      if (page.value === 1) {
        orders.value = list
        statusCount.value = counts
        deadlineAlerts.value = alerts || []
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

// 处理订单操作
const handleAction = async ({ order, action }) => {
  switch (action) {
    case 'confirm_deposit':
      currentOrderForDeposit.value = order
      depositScreenshot.value = []
      depositScreenshotUrl.value = ''
      showDepositDialog.value = true
      break
    case 'confirm_wig':
      currentOrderForWig.value = order
      wigTrackingNo.value = ''
      showWigDialog.value = true
      break
    case 'start':
      await updateOrderStatus(order.id, 'in_progress')
      break
    case 'create_review':
      router.push(`/admin/orders/${order.id}/review`)
      break
    case 'view_review':
      router.push(`/admin/orders/${order.id}/review`)
      break
    case 'confirm_balance':
      await confirmBalance(order)
      break
    case 'ship':
      currentOrderForShip.value = order
      shipForm.shipping_company = ''
      shipForm.shipping_no = ''
      shipForm.balance_confirmed = false
      shipForm.cushioned = false
      shipForm.insured = false
      showShipDialog.value = true
      break
    case 'complete':
      await completeOrder(order)
      break
    default:
      showToast('未知操作')
  }
}

const updateOrderStatus = async (id, status) => {
  try {
    await ordersApi.updateStatus(id, status)
    showSuccessToast('状态已更新')
    onRefresh()
  } catch (error) {
    showFailToast(error.message || '更新失败')
  }
}

const handleDepositUpload = (file) => {
  file.status = 'done'
  depositScreenshotUrl.value = file.content
}

const confirmDeposit = async () => {
  try {
    await ordersApi.confirmDeposit(currentOrderForDeposit.value.id, depositScreenshotUrl.value)
    showSuccessToast('定金已确认')
    onRefresh()
  } catch (error) {
    showFailToast(error.message || '操作失败')
  }
}

const confirmWigReceived = async () => {
  try {
    await ordersApi.confirmWigReceived(currentOrderForWig.value.id, wigTrackingNo.value)
    showSuccessToast('毛坯已确认收货')
    onRefresh()
  } catch (error) {
    showFailToast(error.message || '操作失败')
  }
}

const confirmBalance = async (order) => {
  try {
    await showConfirmDialog({
      title: '确认尾款',
      message: '确认客户已支付尾款？'
    })
    await ordersApi.confirmBalance(order.id)
    showSuccessToast('尾款已确认')
    onRefresh()
  } catch {
    // 取消
  }
}

const handleShip = async () => {
  if (!shipForm.balance_confirmed) {
    showToast('请先确认尾款到账')
    return
  }

  try {
    await ordersApi.ship(currentOrderForShip.value.id, {
      shipping_company: shipForm.shipping_company,
      shipping_no: shipForm.shipping_no,
      checklist: {
        balance_confirmed: shipForm.balance_confirmed,
        cushioned: shipForm.cushioned,
        insured: shipForm.insured
      }
    })
    showSuccessToast('已发货')
    onRefresh()
  } catch (error) {
    showFailToast(error.message || '操作失败')
  }
}

const completeOrder = async (order) => {
  try {
    await showConfirmDialog({
      title: '确认完成',
      message: '确认客户已收货，订单完成？'
    })
    await ordersApi.complete(order.id)
    showSuccessToast('订单已完成')
    onRefresh()
  } catch {
    // 取消
  }
}

const convertInquiry = (inquiry) => {
  convertingInquiry.value = inquiry
  convertForm.price = ''
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

  if (!convertForm.price) {
    showToast('请输入价格')
    return false
  }

  try {
    await inquiriesApi.convert(convertingInquiry.value.id, {
      price: parseFloat(convertForm.price),
      deadline: convertForm.deadline || undefined
    })
    showSuccessToast('订单创建成功')
    showInquiries.value = false
    fetchInquiries()
    onRefresh()
    return true
  } catch (error) {
    showFailToast(error.message || '转换失败')
    return false
  }
}

const showDeadlineAlert = () => {
  const alertList = deadlineAlerts.value
    .map(a => `${a.character_name}: ${a.daysLeft <= 0 ? '已到期' : `${a.daysLeft}天后到期`}`)
    .join('\n')

  showDialog({
    title: '死线预警',
    message: alertList
  })
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

.deposit-dialog,
.wig-dialog,
.ship-dialog {
  padding: 16px;
}

.checklist {
  margin-top: 12px;
}

.checklist-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.checklist .van-checkbox {
  margin-bottom: 8px;
}
</style>
