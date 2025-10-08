'use client'

import Checklist from '@/components/ui/Checklist'

interface TripChecklistViewProps {
  // 将来的にチェックリスト固有のプロパティが必要になった場合に追加
}

export default function TripChecklistView({}: TripChecklistViewProps) {
  return (
    <div className="px-4 py-4 md:hidden">
      <Checklist />
    </div>
  )
}
