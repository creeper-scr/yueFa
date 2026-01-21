<template>
  <div>
    <!-- 确认定金弹窗 -->
    <van-dialog
      v-model:show="showDepositDialog"
      title="确认定金到账"
      show-cancel-button
      @confirm="$emit('confirmDeposit', depositScreenshotUrl)"
    >
      <div class="dialog-content">
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
      @confirm="$emit('confirmWig', wigTrackingNo)"
    >
      <div class="dialog-content">
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
      @confirm="handleShipConfirm"
    >
      <div class="dialog-content">
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
          <p class="checklist-title">
            发货检查:
          </p>
          <van-checkbox v-model="shipForm.balance_confirmed">
            已确认尾款到账
          </van-checkbox>
          <van-checkbox v-model="shipForm.cushioned">
            已使用防震包装
          </van-checkbox>
          <van-checkbox v-model="shipForm.insured">
            已保价
          </van-checkbox>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { showToast } from 'vant'

const emit = defineEmits(['confirmDeposit', 'confirmWig', 'ship'])

const showDepositDialog = ref(false)
const depositScreenshot = ref([])
const depositScreenshotUrl = ref('')

const showWigDialog = ref(false)
const wigTrackingNo = ref('')

const showShipDialog = ref(false)
const shipForm = reactive({
  shipping_company: '',
  shipping_no: '',
  balance_confirmed: false,
  cushioned: false,
  insured: false
})

const handleDepositUpload = (file) => {
  file.status = 'done'
  depositScreenshotUrl.value = file.content
}

const handleShipConfirm = () => {
  if (!shipForm.balance_confirmed) {
    showToast('请先确认尾款到账')
    return
  }
  emit('ship', {
    shipping_company: shipForm.shipping_company,
    shipping_no: shipForm.shipping_no,
    checklist: {
      balance_confirmed: shipForm.balance_confirmed,
      cushioned: shipForm.cushioned,
      insured: shipForm.insured
    }
  })
}

const openDeposit = () => {
  depositScreenshot.value = []
  depositScreenshotUrl.value = ''
  showDepositDialog.value = true
}

const openWig = () => {
  wigTrackingNo.value = ''
  showWigDialog.value = true
}

const openShip = () => {
  shipForm.shipping_company = ''
  shipForm.shipping_no = ''
  shipForm.balance_confirmed = false
  shipForm.cushioned = false
  shipForm.insured = false
  showShipDialog.value = true
}

defineExpose({
  openDeposit,
  openWig,
  openShip
})
</script>

<style scoped>
.dialog-content {
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
