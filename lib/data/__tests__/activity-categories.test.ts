import { getSecondaryCategoryIconName } from '@/lib/data/activity-categories'

describe('getSecondaryCategoryIconName', () => {
  it('returns car icon for personal car and rental car', () => {
    expect(getSecondaryCategoryIconName('transportation', 'personal_car')).toBe('car')
    expect(getSecondaryCategoryIconName('transportation', 'car_rental')).toBe('car')
  })

  it('returns tree icon for nature walk', () => {
    expect(getSecondaryCategoryIconName('exploration', 'nature_walk')).toBe('tree')
  })

  it('returns bed icon for check-in', () => {
    expect(getSecondaryCategoryIconName('accommodation', 'check_in')).toBe('bed')
  })

  it('returns undefined when icon name is not specified', () => {
    expect(getSecondaryCategoryIconName('transportation', 'bus')).toBeUndefined()
  })
})
