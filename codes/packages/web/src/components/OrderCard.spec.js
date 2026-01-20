import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderCard from './OrderCard.vue'

describe('OrderCard', () => {
  // PRD 2.0 九状态测试用的订单数据
  const mockOrder = {
    id: 'order-1',
    customer_name: '测试客户',
    character_name: '初音未来',
    source_work: 'VOCALOID',
    status: 'pending_deposit',
    price: 500,
    deadline: '2026-03-01',
    wig_source: 'client_sends'
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

  // PRD 2.0 九状态标签测试
  it('应该显示正确的状态标签 (PRD 2.0 九状态)', () => {
    const statusTests = [
      { status: 'pending_quote', label: '待报价' },
      { status: 'pending_deposit', label: '待定金' },
      { status: 'awaiting_wig_base', label: '等毛坯' },
      { status: 'queued', label: '排单中' },
      { status: 'in_progress', label: '制作中' },
      { status: 'in_review', label: '验收中' },
      { status: 'pending_balance', label: '待尾款' },
      { status: 'shipped', label: '已发货' },
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

  it('showActions为false时不应显示操作按钮区域', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder, showActions: false }
    })

    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })

  // PRD 2.0 状态操作测试
  it('点击操作按钮应该触发action事件 (PRD 2.0)', async () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder, showActions: true }
    })

    await wrapper.find('.card-footer .van-button').trigger('click')

    expect(wrapper.emitted('action')).toBeTruthy()
    const emittedAction = wrapper.emitted('action')[0][0]
    expect(emittedAction.order).toEqual(mockOrder)
    expect(emittedAction.action).toBe('confirm_deposit')
    expect(emittedAction.label).toBe('确认定金')
  })

  // PRD 2.0 九状态对应操作按钮测试
  it('不同状态应该有不同的操作按钮 (PRD 2.0)', () => {
    const statusActions = [
      { status: 'pending_quote', action: '去报价' },
      { status: 'pending_deposit', action: '确认定金' },
      { status: 'awaiting_wig_base', action: '确认收货' },
      { status: 'queued', action: '开始制作' },
      { status: 'in_progress', action: '提交验收' },
      { status: 'in_review', action: '查看验收' },
      { status: 'shipped', action: '确认完成' }
    ]

    statusActions.forEach(({ status, action }) => {
      const order = { ...mockOrder, status }
      const wrapper = mount(OrderCard, {
        props: { order, showActions: true }
      })

      const button = wrapper.find('.card-footer .van-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe(action)
    })
  })

  // pending_balance 有两个操作
  it('待尾款状态应显示两个操作按钮', () => {
    const order = { ...mockOrder, status: 'pending_balance' }
    const wrapper = mount(OrderCard, {
      props: { order, showActions: true }
    })

    const buttons = wrapper.findAll('.card-footer .van-button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].text()).toBe('确认尾款')
    expect(buttons[1].text()).toBe('发货')
  })

  it('已完成状态不应显示操作按钮', () => {
    const completedOrder = { ...mockOrder, status: 'completed' }
    const wrapper = mount(OrderCard, {
      props: { order: completedOrder, showActions: true }
    })

    expect(wrapper.find('.card-footer').exists()).toBe(false)
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

  // PRD F-03 毛坯来源显示测试
  it('应该显示毛坯来源 (客户寄)', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder }
    })

    expect(wrapper.text()).toContain('客户寄')
  })

  it('应该显示毛坯来源 (代购)', () => {
    const orderWithBuy = { ...mockOrder, wig_source: 'stylist_buys' }
    const wrapper = mount(OrderCard, {
      props: { order: orderWithBuy }
    })

    expect(wrapper.text()).toContain('代购')
  })

  // PRD UI/UX 毛坯图标测试
  it('等毛坯状态应该显示毛坯图标', () => {
    const order = { ...mockOrder, status: 'awaiting_wig_base', wig_source: 'client_sends' }
    const wrapper = mount(OrderCard, {
      props: { order }
    })

    expect(wrapper.find('.wig-icon').exists()).toBe(true)
  })

  it('毛娘代购不显示毛坯图标', () => {
    const order = { ...mockOrder, status: 'awaiting_wig_base', wig_source: 'stylist_buys' }
    const wrapper = mount(OrderCard, {
      props: { order }
    })

    expect(wrapper.find('.wig-icon').exists()).toBe(false)
  })

  // PRD B-02 死线预警测试
  it('死线7天内应该有黄色预警样式', () => {
    const nearDeadline = new Date()
    nearDeadline.setDate(nearDeadline.getDate() + 5)
    const order = { ...mockOrder, deadline: nearDeadline.toISOString().split('T')[0] }
    const wrapper = mount(OrderCard, {
      props: { order }
    })

    expect(wrapper.find('.deadline-yellow').exists()).toBe(true)
  })

  it('死线3天内应该有红色预警样式', () => {
    const urgentDeadline = new Date()
    urgentDeadline.setDate(urgentDeadline.getDate() + 2)
    const order = { ...mockOrder, deadline: urgentDeadline.toISOString().split('T')[0] }
    const wrapper = mount(OrderCard, {
      props: { order }
    })

    expect(wrapper.find('.deadline-red').exists()).toBe(true)
  })

  it('死线超过7天不应该有预警样式', () => {
    const farDeadline = new Date()
    farDeadline.setDate(farDeadline.getDate() + 30)
    const order = { ...mockOrder, deadline: farDeadline.toISOString().split('T')[0] }
    const wrapper = mount(OrderCard, {
      props: { order }
    })

    expect(wrapper.find('.deadline-yellow').exists()).toBe(false)
    expect(wrapper.find('.deadline-red').exists()).toBe(false)
  })
})
