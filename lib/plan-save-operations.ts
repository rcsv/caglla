import { adminDb } from './firebase-admin'
import { COLLECTIONS } from './firestore'
import type { User, Trip, Day, Itinerary, TripFormData, ItineraryFormData, DayFormData, PlaceData } from './types'

// プラン保存用の型定義
export interface PlanSaveData {
  trip: TripFormData
  days: Array<{
    day: DayFormData
    itineraries: ItineraryFormData[]
  }>
}

export interface PlanSaveResult {
  trip: Trip
  days: Day[]
  itineraries: Itinerary[]
}

// プラン保存操作クラス
export class PlanSaveOperations {
  /**
   * 完全なプラン（旅行、日程、旅程）を一括で保存する
   */
  async saveCompletePlan(userId: string, planData: PlanSaveData): Promise<PlanSaveResult> {
    try {
      // 1. 旅行を作成
      const trip = await this.createTripForPlan(userId, planData.trip)
      
      // 2. 日程と旅程を順次作成
      const days: Day[] = []
      const itineraries: Itinerary[] = []
      
      for (const dayData of planData.days) {
        // 日程を作成
        const day = await this.createDayForPlan(trip.id, dayData.day)
        days.push(day)
        
        // 旅程を作成
        for (const itineraryData of dayData.itineraries) {
          const itinerary = await this.createItineraryForPlan(day.id, itineraryData)
          itineraries.push(itinerary)
        }
      }
      
      return {
        trip,
        days,
        itineraries
      }
    } catch (error) {
      console.error('Error saving complete plan:', error)
      throw new Error('プランの保存に失敗しました')
    }
  }

  /**
   * 既存のプランを更新する
   */
  async updateCompletePlan(tripId: string, planData: PlanSaveData): Promise<PlanSaveResult> {
    try {
      // 1. 旅行を更新
      const trip = await this.updateTripForPlan(tripId, planData.trip)
      
      // 2. 既存の日程と旅程を削除
      await this.deleteExistingPlanData(tripId)
      
      // 3. 新しい日程と旅程を作成
      const days: Day[] = []
      const itineraries: Itinerary[] = []
      
      for (const dayData of planData.days) {
        const day = await this.createDayForPlan(tripId, dayData.day)
        days.push(day)
        
        for (const itineraryData of dayData.itineraries) {
          const itinerary = await this.createItineraryForPlan(day.id, itineraryData)
          itineraries.push(itinerary)
        }
      }
      
      return {
        trip,
        days,
        itineraries
      }
    } catch (error) {
      console.error('Error updating complete plan:', error)
      throw new Error('プランの更新に失敗しました')
    }
  }

  /**
   * プランを複製する
   */
  async duplicatePlan(sourceTripId: string, userId: string, newTitle?: string): Promise<PlanSaveResult> {
    try {
      // 1. 元のプランデータを取得
      const sourceTrip = await this.getTripWithDetails(sourceTripId)
      if (!sourceTrip) {
        throw new Error('元のプランが見つかりません')
      }
      
      // 2. 新しいプランを作成
      const newTripData: TripFormData = {
        title: newTitle || `${sourceTrip.trip.title} (コピー)`,
        description: sourceTrip.trip.description,
        start_date: sourceTrip.trip.start_date?.toString() || '',
        end_date: sourceTrip.trip.end_date?.toString() || '',
        access_level: sourceTrip.trip.access_level,
        image_url: sourceTrip.trip.image_url,
        destination: sourceTrip.trip.destination
      }
      
      const newTrip = await this.createTripForPlan(userId, newTripData)
      
      // 3. 日程と旅程を複製
      const days: Day[] = []
      const itineraries: Itinerary[] = []
      
      for (const day of sourceTrip.days) {
        const newDay = await this.createDayForPlan(newTrip.id, {
          day_number: day.day_number,
          description: day.description
        })
        days.push(newDay)
        
        for (const itinerary of day.itineraries || []) {
          const newItinerary = await this.createItineraryForPlan(newDay.id, {
            title: itinerary.title,
            description: itinerary.description,
            location: itinerary.location,
            place_id: (itinerary as any).place_id || itinerary.place_data?.place_id || null,
            start_time: itinerary.start_time,
            end_time: itinerary.end_time,
            cost_amount: itinerary.cost_amount,
            cost_currency: itinerary.cost_currency
          })
          itineraries.push(newItinerary)
        }
      }
      
      return {
        trip: newTrip,
        days,
        itineraries
      }
    } catch (error) {
      console.error('Error duplicating plan:', error)
      throw new Error('プランの複製に失敗しました')
    }
  }

  /**
   * プランをテンプレートとして保存する
   */
  async saveAsTemplate(tripId: string, templateName: string): Promise<void> {
    try {
      const tripData = await this.getTripWithDetails(tripId)
      if (!tripData) {
        throw new Error('プランが見つかりません')
      }
      
      // テンプレート用のコレクションに保存
      const templateData = {
        name: templateName,
        trip_data: tripData.trip,
        days_data: tripData.days,
        itineraries_data: tripData.itineraries,
        created_at: new Date(),
        updated_at: new Date()
      }
      
      await adminDb.collection('templates').add(templateData)
    } catch (error) {
      console.error('Error saving as template:', error)
      throw new Error('テンプレートの保存に失敗しました')
    }
  }

  /**
   * テンプレートからプランを作成する
   */
  async createFromTemplate(templateId: string, userId: string, customizations?: Partial<TripFormData>): Promise<PlanSaveResult> {
    try {
      const templateDoc = await adminDb.collection('templates').doc(templateId).get()
      if (!templateDoc.exists) {
        throw new Error('テンプレートが見つかりません')
      }
      
      const templateData = templateDoc.data()
      
      // カスタマイズを適用
      const tripData: TripFormData = {
        title: customizations?.title || templateData.trip_data.title,
        description: customizations?.description || templateData.trip_data.description,
        start_date: customizations?.start_date || templateData.trip_data.start_date?.toString() || '',
        end_date: customizations?.end_date || templateData.trip_data.end_date?.toString() || '',
        access_level: customizations?.access_level || templateData.trip_data.access_level,
        image_url: customizations?.image_url || templateData.trip_data.image_url,
        destination: customizations?.destination || templateData.trip_data.destination
      }
      
      // プランを作成
      const planData: PlanSaveData = {
        trip: tripData,
        days: templateData.days_data.map((day: Day) => ({
          day: {
            day_number: day.day_number,
            description: day.description
          },
          itineraries: (day.itineraries || []).map((itinerary: Itinerary) => ({
            title: itinerary.title,
            description: itinerary.description,
            location: itinerary.location,
            place_id: (itinerary as any).place_id || itinerary.place_data?.place_id || null,
            start_time: itinerary.start_time,
            end_time: itinerary.end_time,
            cost_amount: itinerary.cost_amount,
            cost_currency: itinerary.cost_currency
          }))
        }))
      }
      
      return await this.saveCompletePlan(userId, planData)
    } catch (error) {
      console.error('Error creating from template:', error)
      throw new Error('テンプレートからのプラン作成に失敗しました')
    }
  }

  // プライベートメソッド

  private async createTripForPlan(userId: string, tripData: TripFormData): Promise<Trip> {
    const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).add({
      user_id: userId,
      title: tripData.title,
      description: tripData.description,
      destination: tripData.destination,
      start_date: tripData.start_date ? new Date(tripData.start_date) : undefined,
      end_date: tripData.end_date ? new Date(tripData.end_date) : undefined,
      access_level: tripData.access_level,
      image_url: tripData.image_url,
      status: 'PLANNING',
      created_at: new Date(),
      updated_at: new Date()
    })
    
    const tripSnap = await tripDoc.get()
    return {
      id: tripSnap.id,
      ...tripSnap.data()
    } as Trip
  }

  private async updateTripForPlan(tripId: string, tripData: TripFormData): Promise<Trip> {
    const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    await tripRef.update({
      title: tripData.title,
      description: tripData.description,
      destination: tripData.destination,
      start_date: tripData.start_date ? new Date(tripData.start_date) : undefined,
      end_date: tripData.end_date ? new Date(tripData.end_date) : undefined,
      access_level: tripData.access_level,
      image_url: tripData.image_url,
      updated_at: new Date()
    })
    
    const tripSnap = await tripRef.get()
    return {
      id: tripSnap.id,
      ...tripSnap.data()
    } as Trip
  }

  private async createDayForPlan(tripId: string, dayData: DayFormData): Promise<Day> {
    const dayDoc = await adminDb.collection(COLLECTIONS.DAYS).add({
      trip_id: tripId,
      day_number: dayData.day_number,
      description: dayData.description,
      created_at: new Date(),
      updated_at: new Date()
    })
    
    const daySnap = await dayDoc.get()
    return {
      id: daySnap.id,
      ...daySnap.data()
    } as Day
  }

  private async createItineraryForPlan(dayId: string, itineraryData: ItineraryFormData): Promise<Itinerary> {
    // sort_numberを決定
    const existingItineraries = await adminDb.collection(COLLECTIONS.ITINERARIES)
      .where('day_id', '==', dayId)
      .orderBy('sort_number', 'desc')
      .limit(1)
      .get()
    
    const nextSortNumber = existingItineraries.empty ? 1 : existingItineraries.docs[0].data().sort_number + 1
    
    const itineraryDoc = await adminDb.collection(COLLECTIONS.ITINERARIES).add({
      day_id: dayId,
      sort_number: nextSortNumber,
      title: itineraryData.title,
      description: itineraryData.description,
      location: itineraryData.location,
      place_id: (itineraryData as any).place_id || itineraryData.place_data?.place_id || null,
      start_time: itineraryData.start_time,
      end_time: itineraryData.end_time,
      timezone: itineraryData.timezone,
      cost_amount: itineraryData.cost_amount,
      cost_currency: itineraryData.cost_currency,
      created_at: new Date(),
      updated_at: new Date()
    })
    
    const itinerarySnap = await itineraryDoc.get()
    return {
      id: itinerarySnap.id,
      ...itinerarySnap.data()
    } as Itinerary
  }

  private async deleteExistingPlanData(tripId: string): Promise<void> {
    // 既存の日程を取得
    const daysSnapshot = await adminDb.collection(COLLECTIONS.DAYS)
      .where('trip_id', '==', tripId)
      .get()
    
    // 各日程の旅程を削除
    for (const dayDoc of daysSnapshot.docs) {
      const itinerariesSnapshot = await adminDb.collection(COLLECTIONS.ITINERARIES)
        .where('day_id', '==', dayDoc.id)
        .get()
      
      for (const itineraryDoc of itinerariesSnapshot.docs) {
        await itineraryDoc.ref.delete()
      }
      
      // 日程を削除
      await dayDoc.ref.delete()
    }
  }

  private async getTripWithDetails(tripId: string): Promise<{
    trip: Trip
    days: Day[]
    itineraries: Itinerary[]
  } | null> {
    try {
      // 旅行を取得
      const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).doc(tripId).get()
      if (!tripDoc.exists) {
        return null
      }
      
      const trip = {
        id: tripDoc.id,
        ...tripDoc.data()
      } as Trip
      
      // 日程を取得
      const daysSnapshot = await adminDb.collection(COLLECTIONS.DAYS)
        .where('trip_id', '==', tripId)
        .orderBy('day_number', 'asc')
        .get()
      
      const days = daysSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Day[]
      
      // 旅程を取得
      const itineraries: Itinerary[] = []
      for (const day of days) {
        const itinerariesSnapshot = await adminDb.collection(COLLECTIONS.ITINERARIES)
          .where('day_id', '==', day.id)
          .orderBy('sort_number', 'asc')
          .get()
        
        const dayItineraries = itinerariesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Itinerary[]
        
        itineraries.push(...dayItineraries)
        day.itineraries = dayItineraries
      }
      
      return {
        trip,
        days,
        itineraries
      }
    } catch (error) {
      console.error('Error getting trip with details:', error)
      return null
    }
  }
}

// シングルトンインスタンス
export const planSaveOperations = new PlanSaveOperations()
