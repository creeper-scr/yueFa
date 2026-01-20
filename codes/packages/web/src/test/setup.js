/**
 * Vitest 测试配置文件
 * 配置全局 Mock 和 Vant 组件
 */
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock vant - 在组件导入之前
vi.mock('vant', () => ({
  showToast: vi.fn(),
  showSuccessToast: vi.fn(),
  showFailToast: vi.fn(),
  showLoadingToast: vi.fn(),
  closeToast: vi.fn()
}))

// 全局组件存根 - 避免 Vant 组件警告
config.global.stubs = {
  // Vant 组件存根
  'van-form': {
    template: '<form class="van-form" @submit.prevent="$emit(\'submit\')"><slot /></form>'
  },
  'van-cell-group': {
    template: '<div class="van-cell-group"><slot /></div>'
  },
  'van-field': {
    template: `
      <div class="van-field">
        <input
          :name="name"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          @click="$emit('click')"
        />
      </div>
    `,
    props: ['modelValue', 'name', 'label', 'placeholder', 'rules', 'readonly', 'isLink', 'type', 'rows', 'autosize'],
    emits: ['update:modelValue', 'click']
  },
  'van-button': {
    template: '<button class="van-button" :class="{ [`van-button--${type}`]: type }" :type="nativeType"><slot /></button>',
    props: ['type', 'nativeType', 'loading', 'round', 'block', 'size']
  },
  'van-tag': {
    template: '<span class="van-tag" :class="{ [`van-tag--${type}`]: type }"><slot /></span>',
    props: ['type', 'size']
  },
  'van-icon': {
    template: '<i class="van-icon" :class="`van-icon-${name}`"></i>',
    props: ['name']
  },
  'van-image': {
    template: '<img class="van-image" :src="src" :alt="alt" />',
    props: ['src', 'fit', 'lazyLoad', 'alt']
  },
  'van-empty': {
    template: '<div class="van-empty"><slot /><span>{{ description }}</span></div>',
    props: ['description']
  },
  'van-loading': {
    template: '<div class="van-loading"></div>',
    props: ['type', 'size']
  },
  'van-popup': {
    template: '<div class="van-popup" v-if="show"><slot /></div>',
    props: ['show', 'position'],
    emits: ['update:show']
  },
  'van-date-picker': {
    template: '<div class="van-date-picker"></div>',
    props: ['modelValue', 'minDate'],
    emits: ['confirm', 'cancel']
  },
  'van-uploader': {
    template: '<div class="van-uploader"><slot /></div>',
    props: ['modelValue', 'maxCount', 'accept', 'previewSize', 'afterRead'],
    emits: ['update:modelValue']
  },
  'van-image-preview': {
    template: '<div class="van-image-preview" v-if="show"></div>',
    props: ['show', 'images', 'startPosition'],
    emits: ['update:show']
  },
  'van-tabs': {
    template: '<div class="van-tabs"><slot /></div>'
  },
  'van-tab': {
    template: '<div class="van-tab"><slot /></div>',
    props: ['name', 'title']
  },
  'van-notice-bar': {
    template: '<div class="van-notice-bar"><slot /></div>'
  },
  'van-tabbar': {
    template: '<div class="van-tabbar"><slot /></div>',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  'van-tabbar-item': {
    template: '<div class="van-tabbar-item"><slot /></div>',
    props: ['name', 'icon']
  },
  'van-nav-bar': {
    template: '<div class="van-nav-bar"><slot /></div>',
    props: ['title']
  },
  'van-dialog': {
    template: '<div class="van-dialog"><slot /></div>'
  },
  'van-radio': {
    template: '<label class="van-radio"><input type="radio" :name="name" :value="name" /><slot /></label>',
    props: ['name']
  },
  'van-radio-group': {
    template: '<div class="van-radio-group"><slot /></div>',
    props: ['modelValue', 'direction'],
    emits: ['update:modelValue']
  },
  'van-checkbox': {
    template: '<label class="van-checkbox"><input type="checkbox" :checked="modelValue" /><slot /></label>',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  'van-pull-refresh': {
    template: '<div class="van-pull-refresh"><slot /></div>',
    props: ['modelValue'],
    emits: ['refresh', 'update:modelValue']
  },
  'van-list': {
    template: '<div class="van-list"><slot /></div>',
    props: ['loading', 'finished', 'finishedText'],
    emits: ['update:loading', 'load']
  },
  'van-cell': {
    template: '<div class="van-cell"><slot /></div>',
    props: ['title', 'value']
  }
}
