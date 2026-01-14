import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderCard from './OrderCard.vue'

describe('OrderCard', () => {
  const mockOrder = {
    id: 'order-1',
    customer_name: '测试客户',
    character_name: '初音未来',
    source_work: 'VOCALOID',
    status: 'pending_deposit',
    price: 500,
    deadline: '2026-03-01'
  }

  it('应该渲染订单基本信息', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder }
    })

    expect(wrapper.find('.customer-name').text()).toBe('测试客户')
    expect(wrapper.find('.character-name').text()).toBe('初音未来')
    expect(wrapper.find('.source-work').text()).toBe('VOCALOID')
  })

  it('客户名称为空时应显示"未知客户"', () => {
    const orderWithoutName = { ...mockOrder, customer_name: '' }
    const wrapper = mount(OrderCard, {
      props: { order: orderWithoutName }
    })

    expect(wrapper.find('.customer-name').text()).toBe('未知客户')
  })

  it('应该显示正确的状态标签', () => {
    const statusTests = [
      { status: 'pending_deposit', label: '待定金' },
      { status: 'in_production', label: '制作中' },
      { status: 'pending_ship', label: '待发货' },
      { status: 'completed', label: '已完成' }
    ]

    statusTests.forEach(({ status, label }) => {
      const order = { ...mockOrder, status }
      const wrapper = mount(OrderCard, {
        props: { order }
      })

      expect(wrapper.find('.van-tag').text()).toBe(label)
    })
  })

  it('应该格式化并显示日期', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder }
    })

    // 2026-03-01 应该显示为 3/1
    expect(wrapper.find('.meta-item').text()).toContain('3/1')
  })

  it('应该显示价格', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder }
    })

    expect(wrapper.text()).toContain('¥500')
  })

  it('点击卡片应该触发click事件', async () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder }
    })

    await wrapper.find('.order-card').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')[0][0]).toEqual(mockOrder)
  })

  it('showActions为true时应该显示操作按钮', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder, showActions: true }
    })

    expect(wrapper.find('.card-footer').exists()).toBe(true)
    expect(wrapper.find('.card-footer .van-button').exists()).toBe(true)
  })

  it('showActions为false时不应显示操作按钮', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder, showActions: false }
    })

    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })

  it('点击操作按钮应该触发action事件', async () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder, showActions: true }
    })

    await wrapper.find('.card-footer .van-button').trigger('click')

    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')[0][0]).toEqual({
      order: mockOrder,
      status: 'in_production'
    })
  })

  it('不同状态应该有不同的操作按钮', () => {
    const statusActions = [
      { status: 'pending_deposit', action: '确认定金' },
      { status: 'in_production', action: '制作完成' },
      { status: 'pending_ship', action: '确认发货' }
    ]

    statusActions.forEach(({ status, action }) => {
      const order = { ...mockOrder, status }
      const wrapper = mount(OrderCard, {
        props: { order, showActions: true }
      })

      expect(wrapper.find('.card-footer .van-button').text()).toBe(action)
    })
  })

  it('已完成状态不应显示操作按钮', () => {
    const completedOrder = { ...mockOrder, status: 'completed' }
    const wrapper = mount(OrderCard, {
      props: { order: completedOrder, showActions: true }
    })

    expect(wrapper.find('.card-footer .van-button').exists()).toBe(false)
  })

  it('没有source_work时不应显示', () => {
    const orderWithoutSource = { ...mockOrder, source_work: '' }
    const wrapper = mount(OrderCard, {
      props: { order: orderWithoutSource }
    })

    expect(wrapper.find('.source-work').exists()).toBe(false)
  })

  it('没有deadline时不应显示日期', () => {
    const orderWithoutDeadline = { ...mockOrder, deadline: null }
    const wrapper = mount(OrderCard, {
      props: { order: orderWithoutDeadline }
    })

    // 应该没有clock图标
    const metaItems = wrapper.findAll('.meta-item')
    const hasClockIcon = metaItems.some(item =>
      item.find('.van-icon-clock-o').exists()
    )
    expect(hasClockIcon).toBe(false)
  })

  it('没有price时不应显示价格', () => {
    const orderWithoutPrice = { ...mockOrder, price: null }
    const wrapper = mount(OrderCard, {
      props: { order: orderWithoutPrice }
    })

    expect(wrapper.text()).not.toContain('¥')
  })
})
