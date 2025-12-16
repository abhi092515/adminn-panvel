# Sports Venue Management System - Design Guidelines

## Design Approach

**Selected System**: Material Design with custom business application patterns  
**Rationale**: Information-dense dashboard requiring robust data visualization, real-time updates, and dual-mode interface (desktop command center + mobile companion). Material Design excels in admin panels with clear hierarchy and functional components.

## Core Design Principles

1. **Efficiency Over Aesthetics**: Every pixel serves a business function
2. **Instant Recognition**: Status-driven visual language (booking states, customer flags, payment status)
3. **Desktop-First, Mobile-Companion**: Primary workspace on large screens, mobile as action controller
4. **Real-Time Clarity**: WebSocket updates must be immediately obvious

---

## Typography System

**Font Stack**: Inter (primary) via Google Fonts CDN, system fallback  

**Hierarchy**:
- Dashboard Headers: text-2xl font-semibold (Command Center, Analytics)
- Section Titles: text-lg font-semibold (Today's Metrics, Booking Calendar)
- Data Labels: text-sm font-medium (Court Names, Customer Names)
- Metadata/Timestamps: text-xs font-normal (Last updated, Booking IDs)
- Numbers/Metrics: text-3xl font-bold (Revenue figures, Court occupancy counts)
- Button Text: text-sm font-medium

---

## Layout System

**Spacing Units**: Tailwind units of **2, 4, 6, and 8** (e.g., p-4, gap-6, m-8, space-y-2)

**Desktop Layout Structure**:
- Fixed sidebar navigation: w-64, left-aligned
- Main content area: flex-1 with max-w-screen-2xl, p-6
- Dashboard grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Calendar view: Full-width with horizontal scroll for multi-court display

**Mobile Layout (Companion Mode)**:
- Bottom navigation: fixed bottom-0, h-16
- Floating action button: fixed bottom-20 right-4 for "Scan QR"
- Full-screen scanner: w-screen h-screen when camera active
- Action cards: Single column, p-4 spacing

**Container Constraints**:
- Dashboard widgets: min-h-32
- Data tables: Scrollable with fixed header
- Forms: max-w-2xl for walk-in booking entry

---

## Component Library

### Navigation
- **Desktop Sidebar**: Persistent, icon + label navigation items, grouped by function (Dashboard, Bookings, Customers, Financials, Settings)
- **Mobile Bottom Nav**: 4 primary tabs (Dashboard, Scan, Bookings, Quick Actions)

### Dashboard Widgets
- **Metric Cards**: Prominent number (text-3xl), label below, optional trend indicator (↑↓)
- **Status Grid**: Courts displayed as cards with status badge, occupancy percentage
- **Quick Actions**: Large touch targets (min-h-12), icon + text buttons

### Booking Calendar
- **Multi-Court View**: Horizontal lanes, time slots as columns, 30-min/60-min intervals
- **Booking Blocks**: Draggable cards with customer name, sport type, payment status badge
- **Critical Color System** (structural, not visual): 4-state system required:
  - Fully Paid (primary state)
  - Partial Payment (warning state)  
  - Payment Pending (alert state)
  - Blocked/Maintenance (neutral state)

### Forms & Data Entry
- **Walk-in Booking**: Vertical form with clear field labels, auto-suggest for customer search
- **Customer Search**: Autocomplete dropdown with avatar + name + phone display
- **Payment Input**: Segmented control (Cash/UPI/Card), amount input with ₹ prefix

### Tables & Lists
- **Customer Database**: Sortable columns, inline badges for tags (VIP, High Risk)
- **Transaction Log**: Dense rows with alternating backgrounds, sticky header
- **Row Actions**: Right-aligned icon buttons (View, Edit, Download)

### CRM Features
- **Customer Tags**: Pill-shaped badges, inline with customer name
- **VIP Indicator**: Gold/premium badge visible in search results and booking forms
- **High Risk Warning**: Modal dialog that appears on booking attempt, requires acknowledgment
- **Customer Profile**: Split layout - left: stats & metrics, right: booking history timeline

### Mobile Scanner Interface
- **Camera View**: Full-screen with overlay guides for QR positioning
- **Scan Result Card**: Slides up from bottom, shows booking details
- **Action Buttons**: Large (min-h-14), full-width, stacked vertically (Check In, Collect Payment, Report Issue)
- **Success/Error States**: Full-screen takeover with large icon and message

### Modals & Overlays
- **Confirmation Dialogs**: Centered, max-w-md, clear primary/secondary actions
- **Reschedule Modal**: Shows old vs new slot, price difference if applicable
- **Settlement Payment**: Multi-step form with summary review

### Real-Time Updates
- **WebSocket Indicators**: Subtle pulse animation on affected dashboard widgets
- **Toast Notifications**: Top-right, auto-dismiss after 4s, stacked if multiple

---

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (Companion mode optimized)
- Tablet: 768px - 1024px (Simplified dashboard)
- Desktop: > 1024px (Full command center)

**Adaptive Patterns**:
- Booking calendar: Horizontal scroll on mobile, full multi-lane on desktop
- Dashboard metrics: Single column mobile → 2-col tablet → 4-col desktop
- Customer profile: Stacked mobile → side-by-side desktop

---

## Progressive Web App (Mobile)

**Install Prompt**: Banner at top on mobile browsers suggesting "Add to Home Screen"  
**Camera Permissions**: Request only when "Scan QR" tapped, clear explanation modal  
**Offline State**: Show "Connection Lost" banner, queue actions for sync when online  
**App Icons**: 192x192 and 512x512 for home screen

---

## Images

**Hero Image**: None - This is a business tool, not a marketing site  

**Contextual Images**:
- Empty state illustrations for "No Bookings Today", "No Customers Found"
- Avatar placeholders for customers without profile photos
- Sport icons for cricket, football, badminton, tennis (use Heroicons or Font Awesome sports icons)
- QR code placeholder in mobile scanner overlay when inactive

**Icon Library**: Font Awesome via CDN for comprehensive business/sports icons

---

## Animation & Interaction

**Minimal Animations** (functional only):
- Drag-and-drop calendar blocks: Smooth transform on drag
- Real-time update: 300ms fade-in for new data
- Modal entry/exit: 200ms slide-up from bottom
- Mobile scanner: Camera shutter effect on successful scan
- Loading states: Spinner for async operations

**No Decorative Animations**: This is a working tool used hundreds of times per day

---

## Accessibility

- WCAG AA compliant contrast ratios (especially critical for status indicators)
- Keyboard navigation for all calendar and form interactions
- Screen reader labels for icon-only buttons
- Focus indicators visible at all times
- Error messages associated with form fields