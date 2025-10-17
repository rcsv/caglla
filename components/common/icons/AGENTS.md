# SVG Icon Guidelines

This document provides comprehensive guidelines for creating, using, and managing SVG icons in the Caglla Travel Manager project.

## 🎯 Purpose

The SVG icon system provides:
- **Consistent Visual Language**: Unified iconography across the application
- **Theme Compatibility**: Icons adapt to different color schemes using `currentColor`
- **Performance**: Scalable vector graphics with minimal file size
- **Accessibility**: Proper ARIA labels and semantic markup
- **Maintainability**: Centralized icon management and reuse

## 📁 File Structure

```
components/common/icons/
├── AGENTS.md                    # This guidelines document
├── AirplaneIcon.tsx            # Transportation icons
├── BackpackIcon.tsx            # Packing/travel gear icons
├── BookmarkIcon.tsx            # Bookmark/save icons
├── CalendarIcon.tsx            # Date/time icons
├── ChartIcon.tsx               # Statistics/analytics icons
├── ClipboardIcon.tsx           # Forms/checklist icons
├── ClockIcon.tsx               # Time-related icons
├── CloseIcon.tsx               # Close/dismiss icons
├── CloudIcon.tsx               # Weather/cloud icons
├── CollapseIcon.tsx            # UI state icons
├── DiningIcon.tsx              # Food/restaurant icons
├── ExpandIcon.tsx              # UI state icons
├── HotelIcon.tsx               # Accommodation icons
├── IconRenderer.tsx            # Dynamic icon resolution
├── LightBulbIcon.tsx           # Tips/suggestions icons
├── LocationIcon.tsx            # Location/place icons
├── MailIcon.tsx                # Communication icons
├── MenuIcon.tsx                # Navigation icons
├── MoneyIcon.tsx               # Financial icons
├── PieChartIcon.tsx            # Data visualization icons
├── PinIcon.tsx                 # Location markers
├── PlannerIcon.tsx             # Planning/travel icons
├── ProhibitionIcon.tsx         # Restriction/block icons
├── PublicAccessBadge.tsx       # Access level indicators
├── RocketIcon.tsx              # Premium/upgrade icons
├── SearchIcon.tsx              # Search/exploration icons
├── ShoppingIcon.tsx            # Shopping/commerce icons
├── SummaryIcon.tsx             # Summary/overview icons
├── TrainIcon.tsx               # Transportation icons
├── UserIcon.tsx                # User/profile icons
└── WarningIcon.tsx             # Alert/warning icons
```

## 🎨 Design Principles

### 1. Visual Consistency
- **Stroke Width**: Use `strokeWidth={2}` as the default
- **Corner Style**: Use `strokeLinecap="round"` and `strokeLinejoin="round"`
- **Size**: Default to `w-4 h-4` (16px) for most use cases
- **Style**: Outline style (fill="none", stroke only)

### 2. Color System
- **Primary**: Use `currentColor` for automatic theme adaptation
- **Custom Colors**: Only when semantic meaning requires specific colors
- **Examples**:
  ```tsx
  // ✅ Good - Theme adaptive
  <WarningIcon className="w-4 h-4" />
  
  // ✅ Good - Semantic color
  <WarningIcon className="w-4 h-4" color="#dc2626" />
  
  // ❌ Avoid - Hardcoded colors
  <WarningIcon className="w-4 h-4" color="red" />
  ```

### 3. Accessibility
- **ARIA Labels**: Always include `aria-label` for screen readers
- **Role**: Use `role="img"` for decorative icons
- **Semantic Meaning**: Icons should enhance, not replace, text content

## 🛠️ Creating New Icons

### Template Structure
```tsx
'use client'

import React from 'react'

export interface [IconName]IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  color?: string
  strokeWidth?: number
}

export const [IconName]Icon: React.FC<[IconName]IconProps> = ({
  className = 'w-4 h-4',
  color = 'currentColor',
  strokeWidth = 2,
  ...rest
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label="[Descriptive Name]"
    className={className}
    {...rest}
  >
    {/* SVG paths here */}
  </svg>
)

export default [IconName]Icon
```

### Icon Design Guidelines

#### 1. ViewBox and Dimensions
- **Standard ViewBox**: Always use `viewBox="0 0 24 24"`
- **Proportions**: Design within a 24x24 grid
- **Padding**: Leave 2px padding around the icon (effective 20x20 drawing area)

#### 2. Path Design
- **Simplicity**: Use minimal paths for clarity at small sizes
- **Recognition**: Ensure icons are recognizable at 16px
- **Consistency**: Follow established patterns from existing icons

#### 3. Semantic Categories
Group icons by functional purpose:

- **Navigation**: MenuIcon, ExpandIcon, CollapseIcon
- **Actions**: CloseIcon, SearchIcon, PinIcon
- **Content Types**: CalendarIcon, MailIcon, MoneyIcon
- **Status**: WarningIcon, ProhibitionIcon, PublicAccessBadge
- **Categories**: AirplaneIcon, HotelIcon, ShoppingIcon, DiningIcon

## 📋 Usage Guidelines

### 1. Import and Usage
```tsx
// ✅ Correct import
import { WarningIcon } from '@/components/common/icons/WarningIcon'

// ✅ Correct usage
<WarningIcon className="w-5 h-5" color="#dc2626" />

// ❌ Avoid direct SVG embedding
<svg>...</svg>
```

### 2. Size Classes
```tsx
// Small (12px) - Inline text, badges
<IconName className="w-3 h-3" />

// Default (16px) - Most UI elements
<IconName className="w-4 h-4" />

// Medium (20px) - Headers, buttons
<IconName className="w-5 h-5" />

// Large (24px) - Prominent features
<IconName className="w-6 h-6" />
```

### 3. Color Usage
```tsx
// Theme adaptive (recommended)
<IconName className="w-4 h-4" />

// Semantic colors
<WarningIcon color="#dc2626" />      // Red for warnings
<MoneyIcon color="#16a34a" />        // Green for money/success
<SearchIcon color="#3b82f6" />       // Blue for actions
<ClockIcon color="#6b7280" />        // Gray for neutral info
```

## 🔄 Dynamic Icon Resolution

### IconRenderer Component
For dynamic icon selection based on data:

```tsx
import { IconRenderer } from '@/components/common/icons/IconRenderer'

// Usage with fallback
<IconRenderer 
  iconName="train" 
  fallbackEmoji="🚆"
  className="w-4 h-4"
  color="#3b82f6"
/>
```

### Icon Mapping
```tsx
// In IconRenderer.tsx
const iconMap: Record<string, React.ComponentType<any>> = {
  'train': TrainIcon,
  'shopping': ShoppingIcon,
  'dining': DiningIcon,
  'hotel': HotelIcon,
  'search': SearchIcon,
  'airplane': AirplaneIcon,
  // Add new mappings here
}
```

## 🚫 Migration from Emoji

### When to Replace Emojis
- **UI Elements**: Always replace emojis in interactive components
- **Form Labels**: Replace emojis in form field labels
- **Navigation**: Replace emojis in menu items and buttons
- **Status Indicators**: Replace emojis in status messages

### When to Keep Emojis
- **User-Generated Content**: Keep emojis in user-created content
- **Country Flags**: Keep flag emojis (not covered by this system)
- **Temporary Content**: Keep emojis in placeholder/example content

### Migration Process
1. **Identify**: Find emoji usage in components
2. **Create**: Create appropriate SVG icon if not exists
3. **Replace**: Update component to use SVG icon
4. **Test**: Verify visual consistency and accessibility
5. **Document**: Update this guide if new patterns emerge

## 🧪 Testing Guidelines

### Visual Testing
- **Size Consistency**: Verify icons render at consistent sizes
- **Color Adaptation**: Test with different themes/color schemes
- **Accessibility**: Verify screen reader compatibility

### Code Testing
```tsx
// Test icon props
<IconName 
  className="w-4 h-4" 
  color="#3b82f6" 
  strokeWidth={2}
  data-testid="icon-name"
/>
```

## 📚 Icon Reference

### Transportation
- `AirplaneIcon`: ✈️ → Air travel, flights
- `TrainIcon`: 🚆 → Rail travel, trains

### Accommodation & Services
- `HotelIcon`: 🏨 → Hotels, accommodation
- `DiningIcon`: 🍽️ → Restaurants, food
- `ShoppingIcon`: 🛍️ → Shopping, commerce

### UI & Navigation
- `MenuIcon`: ☰ → Navigation menus
- `SearchIcon`: 🔍 → Search functionality
- `CloseIcon`: ✕ → Close, dismiss actions
- `ExpandIcon`/`CollapseIcon`: ▼/▶ → Expand/collapse

### Status & Alerts
- `WarningIcon`: ⚠️ → Warnings, cautions
- `ProhibitionIcon`: 🚫 → Restrictions, blocks
- `PublicAccessBadge`: 🌐 → Public access indicators

### Data & Analytics
- `ChartIcon`: 📊 → Statistics, analytics
- `PieChartIcon`: 📈 → Data visualization
- `MoneyIcon`: 💰 → Financial information

### Travel & Planning
- `BackpackIcon`: 🎒 → Packing, travel gear
- `PlannerIcon`: 📋 → Planning, organization
- `LocationIcon`: 📍 → Places, locations
- `PinIcon`: 📌 → Location markers

### Communication
- `MailIcon`: 📧 → Email, messaging
- `UserIcon`: 👤 → User profiles, accounts

### Time & Scheduling
- `CalendarIcon`: 📅 → Dates, scheduling
- `ClockIcon`: ⏰ → Time, duration

### Tips & Information
- `LightBulbIcon`: 💡 → Tips, suggestions
- `SummaryIcon`: 📋 → Summaries, overviews

## 🔧 Maintenance

### Adding New Icons
1. Create new icon file following the template
2. Add to IconRenderer mapping if needed
3. Update this documentation
4. Test across different themes and sizes

### Updating Existing Icons
1. Maintain backward compatibility
2. Update documentation
3. Test existing usage
4. Consider deprecation timeline for breaking changes

### Performance Considerations
- **Bundle Size**: Icons are tree-shakeable
- **Loading**: Icons load with component code
- **Caching**: Icons are cached with application bundle

## 🎨 Design Resources

### Icon Sources
- **Heroicons**: Primary source for icon designs
- **Feather Icons**: Alternative source for consistent style
- **Custom Designs**: Create custom icons following established patterns

### Design Tools
- **Figma**: For icon design and prototyping
- **SVG Optimizers**: For file size optimization
- **Icon Fonts**: Avoid icon fonts, use SVG components instead

## 📝 Best Practices

### Do's ✅
- Use consistent stroke width (2px)
- Include proper ARIA labels
- Use `currentColor` for theme adaptation
- Follow the established naming convention
- Test at multiple sizes
- Document new icon categories

### Don'ts ❌
- Don't use hardcoded colors unless semantically necessary
- Don't create icons without proper accessibility attributes
- Don't mix different stroke widths in the same icon
- Don't use icon fonts instead of SVG components
- Don't create overly complex icons
- Don't skip documentation updates

## 🔮 Future Considerations

### Planned Enhancements
- **Icon Animation**: Add subtle animations for interactive states
- **Icon Variants**: Create filled/outlined variants for different contexts
- **Icon Themes**: Support for different icon styles (outline, filled, duotone)
- **Icon Library**: Expand icon coverage for comprehensive UI needs

### Migration Roadmap
- **Phase 1**: Core UI icons (✅ Complete)
- **Phase 2**: Category-specific icons (✅ Complete)
- **Phase 3**: Advanced UI icons (🔄 In Progress)
- **Phase 4**: Specialized travel icons (📋 Planned)

---

## 📞 Support

For questions about icon usage or requests for new icons:
1. Check existing icons first
2. Review this documentation
3. Create issue with specific requirements
4. Follow the established patterns and guidelines

**Last Updated**: December 2024
**Version**: 1.0
**Maintainer**: Development Team
