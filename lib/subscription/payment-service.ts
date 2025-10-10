/**
 * ダミー課金システム
 * 実際の決済処理は契約後に実装予定
 */

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'paypal'
  last4: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  limits: {
    travelCount: number
    travelDays: number
    storageGB: number
    photosPerTrip: number
  }
}

export interface Subscription {
  id: string
  planId: string
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
  paymentMethod?: PaymentMethod
}

export interface Invoice {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed'
  createdAt: Date
  paidAt?: Date
  downloadUrl?: string
}

// ダミーデータ - subscription-idea.mdに基づく個人向け3段階プラン
const DEMO_PLANS: SubscriptionPlan[] = [
  {
    id: 'season_traveler',
    name: 'Season Traveler',
    price: 0,
    currency: 'JPY',
    interval: 'month',
    features: [
      '基本的な旅程作成',
      'チェックリスト（固定テンプレート）',
      'PDF出力（透かし入り・シンプル）',
      '基本的な地図表示',
      '場所検索・登録'
    ],
    limits: {
      travelCount: 3,
      travelDays: 5,
      storageGB: 0.05,
      photosPerTrip: 5
    }
  },
  {
    id: 'backpacker',
    name: 'Backpacker',
    price: 480,
    currency: 'JPY',
    interval: 'month',
    features: [
      'Season Travelerの全機能',
      'ルート最適化（徒歩・車・電車）',
      'チェックリスト（カスタム作成）',
      'PDF出力（透かしなし・カスタムカバー）',
      '同行者共有（閲覧のみ）',
      '基本的なコスト計算'
    ],
    limits: {
      travelCount: 10,
      travelDays: 14,
      storageGB: 0.5,
      photosPerTrip: 50
    }
  },
  {
    id: 'globetrotter',
    name: 'Globetrotter',
    price: 980,
    currency: 'JPY',
    interval: 'month',
    features: [
      'Backpackerの全機能',
      '高度ルート最適化（複合交通）',
      '同行者との共同編集',
      'AIによる旅程提案',
      'PDF出力（高解像度・ブランド対応）',
      '詳細なコスト分析',
      '優先サポート'
    ],
    limits: {
      travelCount: -1, // 無制限
      travelDays: -1,
      storageGB: 5,
      photosPerTrip: -1
    }
  }
]

class DummyPaymentService {
  private subscriptions: Map<string, Subscription> = new Map()
  private invoices: Map<string, Invoice> = new Map()
  private paymentMethods: Map<string, PaymentMethod> = new Map()

  constructor() {
    this.initializeDemoData()
  }

  private initializeDemoData() {
    // デモ用の支払い方法
    this.paymentMethods.set('demo_card_1', {
      id: 'demo_card_1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025
    })

    // デモ用のサブスクリプション（無料プラン）
    this.subscriptions.set('demo_sub_1', {
      id: 'demo_sub_1',
      planId: 'season_traveler',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    })
  }

  // プラン一覧取得
  async getPlans(): Promise<SubscriptionPlan[]> {
    await this.simulateDelay()
    return [...DEMO_PLANS]
  }

  // プラン詳細取得
  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    await this.simulateDelay()
    return DEMO_PLANS.find(plan => plan.id === planId) || null
  }

  // 支払い方法一覧取得
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    await this.simulateDelay()
    return Array.from(this.paymentMethods.values())
  }

  // 支払い方法追加
  async addPaymentMethod(userId: string, paymentData: any): Promise<PaymentMethod> {
    await this.simulateDelay()
    
    const paymentMethod: PaymentMethod = {
      id: `demo_card_${Date.now()}`,
      type: 'card',
      last4: paymentData.last4 || '4242',
      brand: paymentData.brand || 'Visa',
      expiryMonth: paymentData.expiryMonth || 12,
      expiryYear: paymentData.expiryYear || 2025
    }

    this.paymentMethods.set(paymentMethod.id, paymentMethod)
    return paymentMethod
  }

  // サブスクリプション作成
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId?: string,
    trialDays?: number
  ): Promise<Subscription> {
    await this.simulateDelay()

    const plan = DEMO_PLANS.find(p => p.id === planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30日後

    const subscription: Subscription = {
      id: `sub_${Date.now()}`,
      planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      trialEnd: trialDays ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined,
      paymentMethod: paymentMethodId ? this.paymentMethods.get(paymentMethodId) : undefined
    }

    this.subscriptions.set(subscription.id, subscription)

    // 請求書作成
    if (plan.price > 0) {
      await this.createInvoice(subscription.id, plan.price, plan.currency)
    }

    return subscription
  }

  // サブスクリプション取得
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    await this.simulateDelay()
    return this.subscriptions.get(subscriptionId) || null
  }

  // サブスクリプション更新
  async updateSubscription(
    subscriptionId: string,
    planId: string
  ): Promise<Subscription> {
    await this.simulateDelay()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    const plan = DEMO_PLANS.find(p => p.id === planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    subscription.planId = planId
    subscription.currentPeriodStart = new Date()
    subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    this.subscriptions.set(subscriptionId, subscription)

    // 新しい請求書作成
    if (plan.price > 0) {
      await this.createInvoice(subscriptionId, plan.price, plan.currency)
    }

    return subscription
  }

  // サブスクリプションキャンセル
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    await this.simulateDelay()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    subscription.cancelAtPeriodEnd = true
    this.subscriptions.set(subscriptionId, subscription)

    return subscription
  }

  // サブスクリプション復活
  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    await this.simulateDelay()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    subscription.cancelAtPeriodEnd = false
    subscription.status = 'active'
    this.subscriptions.set(subscriptionId, subscription)

    return subscription
  }

  // 請求書作成
  private async createInvoice(
    subscriptionId: string,
    amount: number,
    currency: string
  ): Promise<Invoice> {
    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      subscriptionId,
      amount,
      currency,
      status: 'paid', // デモでは自動的に支払い済み
      createdAt: new Date(),
      paidAt: new Date(),
      downloadUrl: `https://demo-caglla.com/invoices/${subscriptionId}.pdf`
    }

    this.invoices.set(invoice.id, invoice)
    return invoice
  }

  // 請求書一覧取得
  async getInvoices(subscriptionId: string): Promise<Invoice[]> {
    await this.simulateDelay()
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.subscriptionId === subscriptionId)
  }

  // 請求書ダウンロードURL取得
  async getInvoiceDownloadUrl(invoiceId: string): Promise<string> {
    await this.simulateDelay()
    const invoice = this.invoices.get(invoiceId)
    if (!invoice) {
      throw new Error('Invoice not found')
    }
    return invoice.downloadUrl || ''
  }

  // 支払い処理（ダミー）
  async processPayment(
    amount: number,
    currency: string,
    paymentMethodId: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    await this.simulateDelay()

    // デモ用の支払い処理
    const success = Math.random() > 0.1 // 90%の確率で成功

    if (success) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    } else {
      return {
        success: false,
        error: 'Payment failed. Please check your payment method.'
      }
    }
  }

  // 返金処理（ダミー）
  async processRefund(
    transactionId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    await this.simulateDelay()

    return {
      success: true,
      refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  // デモ用の遅延シミュレーション
  private async simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // デバッグ用：全データリセット
  resetDemoData(): void {
    this.subscriptions.clear()
    this.invoices.clear()
    this.paymentMethods.clear()
    this.initializeDemoData()
  }

  // デバッグ用：データ取得
  getDebugData() {
    return {
      subscriptions: Array.from(this.subscriptions.values()),
      invoices: Array.from(this.invoices.values()),
      paymentMethods: Array.from(this.paymentMethods.values())
    }
  }
}

// シングルトンインスタンス
export const dummyPaymentService = new DummyPaymentService()

// 便利なヘルパー関数
export const paymentHelpers = {
  // プラン価格の表示用フォーマット
  formatPrice(price: number, currency: string): string {
    if (price === 0) return '無料'
    return `¥${price.toLocaleString()}/${currency === 'JPY' ? '月' : 'year'}`
  },

  // プラン制限の表示用フォーマット
  formatLimit(limit: number, type: string): string {
    if (limit === -1) return '無制限'
    
    switch (type) {
      case 'travelCount':
        return `${limit}件まで`
      case 'travelDays':
        return `${limit}日以内`
      case 'storageGB':
        return `${limit}GB`
      case 'photosPerTrip':
        return `${limit}枚/旅行`
      default:
        return limit.toString()
    }
  },

  // サブスクリプション状態の表示用フォーマット
  formatSubscriptionStatus(status: string): string {
    switch (status) {
      case 'active':
        return 'アクティブ'
      case 'cancelled':
        return 'キャンセル済み'
      case 'past_due':
        return '支払い遅延'
      case 'trialing':
        return 'トライアル中'
      default:
        return status
    }
  },

  // 請求書状態の表示用フォーマット
  formatInvoiceStatus(status: string): string {
    switch (status) {
      case 'paid':
        return '支払い済み'
      case 'pending':
        return '支払い待ち'
      case 'failed':
        return '支払い失敗'
      default:
        return status
    }
  }
}
