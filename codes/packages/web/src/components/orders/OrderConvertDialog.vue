<template>
  <div>
    <van-dialog
      :show="show"
      title="转为订单"
      show-cancel-button
      :before-close="handleClose"
      @update:show="$emit('update:show', $event)"
    >
      <van-form>
        <van-cell-group>
          <van-field
            v-model="form.price"
            label="价格"
            type="number"
            placeholder="成交价格"
          />
          <van-cell title="定金" :value="computedDeposit ? `¥${computedDeposit}` : '自动计算(20%)'" />
          <van-cell title="尾款" :value="computedBalance ? `¥${computedBalance}` : '自动计算(80%)'" />
          <van-field
            v-model="form.deadline"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  inquiry: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:show', 'confirm'])

const form = reactive({
  price: '',
  deadline: ''
})

const showDatePicker = ref(false)
const selectedDate = ref([])

watch(() => props.inquiry, (inquiry) => {
  if (inquiry) {
    form.price = ''
    form.deadline = inquiry.expected_deadline || ''
  }
})

const computedDeposit = computed(() => {
  if (!form.price) return ''
  return Math.round(parseFloat(form.price) * 0.2 * 100) / 100
})

const computedBalance = computed(() => {
  if (!form.price) return ''
  return Math.round(parseFloat(form.price) * 0.8 * 100) / 100
})

const onDateConfirm = ({ selectedValues }) => {
  form.deadline = selectedValues.join('-')
  showDatePicker.value = false
}

const handleClose = async (action) => {
  if (action !== 'confirm') return true

  if (!form.price) {
    showToast('请输入价格')
    return false
  }

  emit('confirm', {
    price: parseFloat(form.price),
    deadline: form.deadline || undefined
  })
  return true
}
</script>
