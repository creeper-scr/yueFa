import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InquiryForm from './InquiryForm.vue'

describe('InquiryForm', () => {
  const defaultProps = {
    userSlug: 'test-shop'
  }

  it('应该渲染所有表单字段', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    // 检查必填字段
    expect(wrapper.find('[name="customer_name"]').exists()).toBe(true)
    expect(wrapper.find('[name="customer_contact"]').exists()).toBe(true)
    expect(wrapper.find('[name="character_name"]').exists()).toBe(true)

    // 检查可选字段
    expect(wrapper.find('[name="source_work"]').exists()).toBe(true)
    expect(wrapper.find('[name="expected_deadline"]').exists()).toBe(true)
    expect(wrapper.find('[name="head_circumference"]').exists()).toBe(true)
    expect(wrapper.find('[name="budget_range"]').exists()).toBe(true)

    // PRD F-01 新增字段
    expect(wrapper.find('[name="head_notes"]').exists()).toBe(true)
    expect(wrapper.find('[name="special_requirements"]').exists()).toBe(true)

    // PRD F-03 毛坯来源
    expect(wrapper.find('[name="wig_source"]').exists()).toBe(true)
  })

  it('应该显示提交按钮', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    const submitBtn = wrapper.find('.van-button--primary')
    expect(submitBtn.exists()).toBe(true)
    expect(submitBtn.text()).toBe('提交询价')
  })

  it('提交表单时应触发submit事件', async () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    // 填写必填字段
    await wrapper.find('[name="customer_name"]').setValue('测试用户')
    await wrapper.find('[name="customer_contact"]').setValue('微信: test123')
    await wrapper.find('[name="character_name"]').setValue('初音未来')

    // 触发表单提交
    await wrapper.find('.van-form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('提交数据应该包含userSlug', async () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    // 填写必填字段
    await wrapper.find('[name="customer_name"]').setValue('测试用户')
    await wrapper.find('[name="customer_contact"]').setValue('微信: test123')
    await wrapper.find('[name="character_name"]').setValue('初音未来')

    await wrapper.find('.van-form').trigger('submit')

    const emittedData = wrapper.emitted('submit')[0][0]
    expect(emittedData.user_slug).toBe('test-shop')
  })

  it('reset方法应该清空表单', async () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    // 直接修改form
    wrapper.vm.form.customer_name = '测试用户'
    wrapper.vm.form.character_name = '初音未来'

    // 调用reset
    wrapper.vm.reset()
    await wrapper.vm.$nextTick()

    // 验证字段被清空
    expect(wrapper.vm.form.customer_name).toBe('')
    expect(wrapper.vm.form.character_name).toBe('')
    expect(wrapper.vm.form.reference_images).toEqual([])
    expect(wrapper.vm.fileList).toEqual([])
  })

  it('应该暴露reset方法', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    expect(typeof wrapper.vm.reset).toBe('function')
  })

  it('日期选择器应该默认隐藏', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    expect(wrapper.vm.showDatePicker).toBe(false)
  })

  it('点击期望交付字段应显示日期选择器', async () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    await wrapper.find('[name="expected_deadline"]').trigger('click')

    expect(wrapper.vm.showDatePicker).toBe(true)
  })

  it('上传图片应更新fileList和form.reference_images', async () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    // 模拟上传
    const mockFile = {
      content: 'data:image/png;base64,abc123',
      status: ''
    }

    await wrapper.vm.handleUpload(mockFile)

    expect(mockFile.status).toBe('done')
    expect(wrapper.vm.form.reference_images).toContain('data:image/png;base64,abc123')
  })

  it('日期确认应更新表单字段', async () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    // 模拟日期选择确认
    wrapper.vm.onDateConfirm({ selectedValues: ['2026', '03', '15'] })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.expected_deadline).toBe('2026-03-15')
    expect(wrapper.vm.showDatePicker).toBe(false)
  })

  it('minDate应该是今天或之后', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const minDate = new Date(wrapper.vm.minDate)
    minDate.setHours(0, 0, 0, 0)

    expect(minDate.getTime()).toBeGreaterThanOrEqual(today.getTime())
  })

  it('提交后loading状态应该正确变化', async () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    // 初始状态
    expect(wrapper.vm.loading).toBe(false)

    // 触发提交并等待完成
    await wrapper.vm.handleSubmit()

    // 提交完成后loading应该恢复为false
    expect(wrapper.vm.loading).toBe(false)
  })

  it('表单初始状态应该是空的', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    expect(wrapper.vm.form.customer_name).toBe('')
    expect(wrapper.vm.form.customer_contact).toBe('')
    expect(wrapper.vm.form.character_name).toBe('')
    expect(wrapper.vm.form.source_work).toBe('')
    expect(wrapper.vm.form.expected_deadline).toBe('')
    expect(wrapper.vm.form.head_circumference).toBe('')
    expect(wrapper.vm.form.budget_range).toBe('')
    // PRD F-01 新字段
    expect(wrapper.vm.form.head_notes).toBe('')
    expect(wrapper.vm.form.special_requirements).toBe('')
    // PRD F-03 毛坯来源默认值
    expect(wrapper.vm.form.wig_source).toBe('client_sends')
    expect(wrapper.vm.form.reference_images).toEqual([])
  })

  it('fileList初始状态应该是空数组', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    expect(wrapper.vm.fileList).toEqual([])
  })

  // PRD F-03 毛坯来源测试
  it('应该包含毛坯来源选择器', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    // 检查毛坯来源字段存在
    expect(wrapper.find('[name="wig_source"]').exists()).toBe(true)
  })

  it('毛坯来源默认为客户寄', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    expect(wrapper.vm.form.wig_source).toBe('client_sends')
  })

  // PRD F-01 头围测量指南测试
  it('头围测量指南默认隐藏', () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    expect(wrapper.vm.showHeadMeasureGuide).toBe(false)
  })

  it('提交数据应包含PRD 2.0新字段', async () => {
    const wrapper = mount(InquiryForm, {
      props: defaultProps
    })

    // 填写表单
    wrapper.vm.form.customer_name = '测试用户'
    wrapper.vm.form.customer_contact = 'wx: test123'
    wrapper.vm.form.character_name = '初音未来'
    wrapper.vm.form.head_notes = '头型偏扁'
    wrapper.vm.form.wig_source = 'stylist_buys'
    wrapper.vm.form.special_requirements = '需要发际线自然过渡'

    await wrapper.find('.van-form').trigger('submit')

    const emittedData = wrapper.emitted('submit')[0][0]
    expect(emittedData.head_notes).toBe('头型偏扁')
    expect(emittedData.wig_source).toBe('stylist_buys')
    expect(emittedData.special_requirements).toBe('需要发际线自然过渡')
  })
})
