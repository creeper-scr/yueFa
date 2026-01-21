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
    <OrderFilters v-model="currentStatus" :status-count="statusCount" />

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
    <OrderInquiryPopup
      v-model:show="showInquiries"
      :inquiries="inquiries"
      @reject="rejectInquiry"
      @convert="convertInquiry"
    />

    <!-- 转换订单弹窗 -->
    <OrderConvertDialog
      v-model:show="showConvertDialog"
      :inquiry="convertingInquiry"
      @confirm="handleConvertConfirm"
    />

    <!-- 操作弹窗 -->
    <OrderActionDialogs
      ref="actionDialogsRef"
      @confirm-deposit="handleConfirmDeposit"
      @confirm-wig="handleConfirmWig"
      @ship="handleShip"
    />

    <AdminTabbar />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast, showConfirmDialog, showDialog } from 'vant'
import { ordersApi, inquiriesApi } from '@/api'
import OrderCard from '@/components/OrderCard.vue'
import AdminTabbar from '@/components/AdminTabbar.vue'
import OrderFilters from '@/components/orders/OrderFilters.vue'
import OrderInquiryPopup from '@/components/orders/OrderInquiryPopup.vue'
import OrderConvertDialog from '@/components/orders/OrderConvertDialog.vue'
import OrderActionDialogs from '@/components/orders/OrderActionDialogs.vue'

const router = useRouter()

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

const actionDialogsRef = ref(null)
const currentOrderId = ref(null)

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
  } catch (_error) {
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
  } catch (_error) {
    // 静默失败,询价列表为辅助功能
  }
}

const goToDetail = (order) => {
  router.push(`/admin/orders/${order.id}`)
}

const handleAction = async ({ order, action }) => {
  currentOrderId.value = order.id

  switch (action) {
    case 'confirm_deposit':
      actionDialogsRef.value?.openDeposit()
      break
    case 'confirm_wig':
      actionDialogsRef.value?.openWig()
      break
    case 'start':
      await updateOrderStatus(order.id, 'in_progress')
      break
    case 'create_review':
    case 'view_review':
      router.push(`/admin/orders/${order.id}/review`)
      break
    case 'confirm_balance':
      await confirmBalance(order)
      break
    case 'ship':
      actionDialogsRef.value?.openShip()
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

const handleConfirmDeposit = async (screenshotUrl) => {
  try {
    await ordersApi.confirmDeposit(currentOrderId.value, screenshotUrl)
    showSuccessToast('定金已确认')
    onRefresh()
  } catch (error) {
    showFailToast(error.message || '操作失败')
  }
}

const handleConfirmWig = async (trackingNo) => {
  try {
    await ordersApi.confirmWigReceived(currentOrderId.value, trackingNo)
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

const handleShip = async (shipData) => {
  try {
    await ordersApi.ship(currentOrderId.value, shipData)
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
  showConvertDialog.value = true
}

const handleConvertConfirm = async (formData) => {
  try {
    await inquiriesApi.convert(convertingInquiry.value.id, formData)
    showSuccessToast('订单创建成功')
    showInquiries.value = false
    showConvertDialog.value = false
    fetchInquiries()
    onRefresh()
  } catch (error) {
    showFailToast(error.message || '转换失败')
  }
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

const showDeadlineAlert = () => {
  const alertList = deadlineAlerts.value
    .map(a => `${a.character_name}: ${a.daysLeft <= 0 ? '已到期' : `${a.daysLeft}天后到期`}`)
    .join('\n')

  showDialog({
    title: '死线预警',
    message: alertList
  })
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
</style>
