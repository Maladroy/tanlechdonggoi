# Product Variants Refactor - Implementation Instructions

## 📋 Overview
This document outlines the complete refactoring plan for the product variant system in the Tân Lếch Đóng Gói admin panel and shop interface.

**Current Issues:**
- Variants don't support price modifications (only base price)
- No support for variant combinations (permutations)
- Cannot disable specific variant combinations
- Poor UI/UX for variant management
- No drag-and-drop reordering capability
- No proper validation for variant combinations

---

## 🎯 Goals
1. **Price Management**: Implement price change values instead of absolute prices
2. **Permutation Support**: Allow multiple variant dimensions to work together
3. **Selective Availability**: Disable specific variant combinations
4. **Improved UI**: Intuitive drag-and-drop interface with better organization
5. **Database Persistence**: All changes reflect in Firestore immediately

---

## 📐 New Data Structure

### Updated Type Definitions (`types.ts`)

```typescript
// New variant value structure with price adjustment
export interface VariantValue {
  id: string; // Unique identifier for the value
  label: string; // Display name (e.g., "S", "Red", "Cotton")
  priceChange: number; // Price adjustment (can be positive, negative, or 0)
  order: number; // For drag-and-drop ordering
  imageUrl?: string; // Optional image for this specific value
}

// Updated variant option structure
export interface VariantOption {
  id: string; // Unique identifier
  name: string; // e.g., "Size", "Color", "Material"
  values: VariantValue[]; // Array of possible values
  order: number; // For drag-and-drop ordering of variant types
  required: boolean; // Whether user must select this variant
}

// Variant combination availability rules
export interface VariantCombinationRule {
  id: string;
  combination: Record<string, string>; // { "Size": "S", "Color": "Red" }
  isAvailable: boolean; // Whether this combination can be selected
  reason?: string; // Optional reason for unavailability (e.g., "Out of stock")
  customPriceAdjustment?: number; // Optional override for combination-specific pricing
}

// Updated Combo interface
export interface Combo {
  id: string;
  name: string;
  description: string;
  items: string[];
  originalPrice: number;
  price: number; // Base price
  imageUrl: string;
  tags: string[];
  category?: string;
  link?: string;
  coupon?: string;
  status?: ComboStatus;
  type?: "combo" | "product";
  
  // NEW: Enhanced variant system
  variants?: VariantOption[]; // Ordered array of variant options
  variantCombinationRules?: VariantCombinationRule[]; // Rules for combinations
  defaultVariantImage?: string; // Fallback image when no variant selected
}

// Updated CartItem to include computed price
export interface CartItem extends Combo {
  quantity: number;
  selectedVariants?: Record<string, string>; // { "Size": "valueId", "Color": "valueId" }
  computedPrice?: number; // Final price after variant adjustments
}
```

---

## 🔨 Implementation Tasks

### Phase 1: Backend & Type System Updates

#### Task 1.1: Update Type Definitions ✅
- **File**: `types.ts`
- **Actions**:
  - [x] Add new `VariantValue` interface with `id`, `label`, `priceChange`, `order`, `imageUrl?`
  - [x] Update `VariantOption` interface to use `VariantValue[]` instead of `string[]`
  - [x] Add `id`, `order`, `required` fields to `VariantOption`
  - [x] Create `VariantCombinationRule` interface
  - [x] Update `Combo` interface to include `variantCombinationRules?` and `defaultVariantImage?`
  - [x] Update `CartItem` to include `computedPrice?`

#### Task 1.2: Create Utility Functions ✅
- **File**: `utils.ts`
- **Actions**:
  - [x] Create `calculateVariantPrice(basePrice: number, selectedVariants: Record<string, string>, variantOptions: VariantOption[]): number`
    - Takes base price and selected variant IDs
    - Returns final price after applying all price adjustments
  - [x] Create `isVariantCombinationAvailable(selectedVariants: Record<string, string>, rules?: VariantCombinationRule[]): { available: boolean, reason?: string }`
    - Checks if selected combination is available
    - Returns availability status and reason
  - [x] Create `getAllPossibleCombinations(variantOptions: VariantOption[]): Record<string, string>[]`
    - Generates all possible permutations for rule management
  - [x] Create `getVariantValueById(variantOptions: VariantOption[], variantName: string, valueId: string): VariantValue | null`
    - Helper to retrieve specific variant value
  - [x] Create `migrateOldVariantData(oldVariants: OldVariantOption[]): VariantOption[]`
    - Migration function for existing data (ensureNewVariantFormat)

#### Task 1.3: Database Migration Script
- **File**: Create `scripts/migrateVariants.ts` (optional Node script)
- **Actions**:
  - [ ] Create migration script to convert existing variant data
  - [ ] Convert old `values: string[]` to new `values: VariantValue[]` format
  - [ ] Generate unique IDs for all variant options and values
  - [ ] Set default `order` based on current array position
  - [ ] Set `priceChange: 0` for all existing variants
  - [ ] Add `required: true` as default
  - [ ] Test migration on development data first
  - [ ] Document rollback procedure

---

### Phase 2: Admin Panel - Variant Management UI ✅

#### Task 2.1: Install Drag-and-Drop Library ✅
- **Actions**:
  - [x] Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
    ```bash
    npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
    ```
  - [x] Add type definitions (included in @dnd-kit packages)

#### Task 2.2: Create Variant Management Component ✅
- **File**: `components/admin/VariantManager.tsx`
- **Purpose**: Reusable component for managing product variants
- **Props**: 
  ```typescript
  interface VariantManagerProps {
    variants: VariantOption[];
    onChange: (variants: VariantOption[]) => void;
    basePrice: number;
  }
  ```
- **Features**:
  - [ ] Display list of variant options (Size, Color, etc.)
  - [ ] Drag-and-drop to reorder variant options
  - [ ] Add new variant option button
  - [ ] For each variant option:
    - [ ] Edit name inline
    - [ ] Toggle "required" checkbox
    - [ ] Delete option button
    - [ ] Manage values list:
      - [ ] Drag-and-drop to reorder values
      - [ ] Add new value with label + price change
      - [ ] Edit value inline (label, price change)
      - [ ] Optional image URL input
      - [ ] Delete value button
      - [ ] Preview of final price with this variant
  - [ ] Clean, modern UI with proper spacing and visual hierarchy

#### Task 2.3: Create Combination Rules Manager Component
- **File**: Create `components/admin/CombinationRulesManager.tsx`
- **Props**:
  ```typescript
  interface CombinationRulesManagerProps {
    variantOptions: VariantOption[];
    rules: VariantCombinationRule[];
    onChange: (rules: VariantCombinationRule[]) => void;
  }
  ```
- **Features**:
  - [ ] Display table/grid of all possible combinations
  - [ ] Auto-generate combinations based on variant options
  - [ ] For each combination:
    - [ ] Display variant selections (e.g., "Size: S, Color: Red")
    - [ ] Toggle availability checkbox
    - [ ] Optional reason input (shown when unavailable)
    - [ ] Optional custom price adjustment
  - [ ] Search/filter combinations
  - [ ] Bulk actions (enable/disable multiple)
  - [ ] Smart UI: collapse/expand sections for better UX
  - [ ] Warning when disabling popular combinations

#### Task 2.4: Update AdminCombos Component
- **File**: `components/admin/AdminCombos.tsx`
- **Actions**:
  - [ ] Import `VariantManager` and `CombinationRulesManager` components
  - [ ] Replace current variant management section with `<VariantManager>`
  - [ ] Add `<CombinationRulesManager>` below variant manager (only shown when variants exist)
  - [ ] Update form submission to include new variant structure
  - [ ] Add validation:
    - [ ] Ensure all variant options have at least one value
    - [ ] Ensure variant option names are unique
    - [ ] Ensure variant value labels are unique within each option
    - [ ] Warn if no base price set when variants have price changes
  - [ ] Update preview logic to show calculated prices
  - [ ] Add "Generate all combinations" helper button
  - [ ] Clean up old variant management code

#### Task 2.5: Enhance UI/UX Details
- **File**: `components/admin/AdminCombos.tsx` and variant components
- **Actions**:
  - [ ] Add loading states during save operations
  - [ ] Add success/error toast notifications
  - [ ] Add confirmation dialogs for destructive actions (delete variant, etc.)
  - [ ] Add helpful tooltips explaining price changes
  - [ ] Add sample/example button to pre-fill test data
  - [ ] Improve responsive design for mobile
  - [ ] Add keyboard shortcuts for power users
  - [ ] Add undo/redo capability (optional, advanced)

---

### Phase 3: Shop Frontend - Variant Selection

#### Task 3.1: Update ProductDetailModal Component
- **File**: `components/ProductDetailModal.tsx`
- **Actions**:
  - [ ] Update variant selection rendering to use new `VariantOption[]` structure
  - [ ] Display price changes for each variant value
    - Format: "Medium (+5,000₫)" or "Small (-2,000₫)"
  - [ ] Calculate and display real-time price as user selects variants
  - [ ] Show total price = base price + sum of price changes
  - [ ] Disable unavailable combinations:
    - [ ] Gray out unavailable values based on current selections
    - [ ] Show tooltip explaining why unavailable
  - [ ] Update image when variant selected (if `imageUrl` exists)
  - [ ] Validate all required variants selected before add to cart
  - [ ] Improve selection UI:
    - [ ] Larger click targets
    - [ ] Better visual feedback
    - [ ] Show selected state clearly
  - [ ] Add "Clear selection" button

#### Task 3.2: Update Cart Component
- **File**: `components/Cart.tsx`
- **Actions**:
  - [ ] Display selected variants for each cart item
  - [ ] Show computed price (with variant adjustments) instead of base price
  - [ ] Format: "Size: Medium, Color: Blue"
  - [ ] Update total calculation to use `computedPrice`
  - [ ] Handle price changes when editing cart items (if feature exists)
  - [ ] Show breakdown: "Base: 50,000₫ + Variants: +5,000₫ = 55,000₫" (optional, for transparency)

#### Task 3.3: Update Shop Component
- **File**: `components/Shop.tsx`
- **Actions**:
  - [ ] No major changes needed
  - [ ] Ensure "Chọn Phân Loại" button works correctly
  - [ ] Consider showing price range if variants have significant differences
    - Format: "From 45,000₫ - 60,000₫"

#### Task 3.4: Add Price Calculation Logic
- **File**: Utility functions or component logic
- **Actions**:
  - [ ] When adding to cart, calculate final price:
    ```typescript
    const computedPrice = calculateVariantPrice(
      combo.price,
      selectedVariants,
      combo.variants
    );
    ```
  - [ ] Store `computedPrice` in `CartItem`
  - [ ] Use computed price for all cart operations
  - [ ] Update order total calculations

---

### Phase 4: Firebase & State Management

#### Task 4.1: Update Firebase Service
- **File**: `services/firebase.ts`
- **Actions**:
  - [ ] Update `addCombo` to handle new variant structure
  - [ ] Update `updateCombo` to handle new variant structure
  - [ ] Add validation before saving to Firestore
  - [ ] Ensure variant IDs are unique (use UUID or Firestore auto-ID)
  - [ ] Add indexes if needed for variant queries (check Firestore console)

#### Task 4.2: Update Firestore Security Rules
- **File**: `firestore.rules`
- **Actions**:
  - [ ] Review and update validation rules for variant fields
  - [ ] Ensure `variantCombinationRules` is properly validated
  - [ ] Add rules to prevent invalid data structures
  - [ ] Test with Firebase emulator

#### Task 4.3: Update App.tsx State Management
- **File**: `App.tsx` (or wherever cart state lives)
- **Actions**:
  - [ ] Update `addToCart` function to accept and store `selectedVariants` and `computedPrice`
  - [ ] Update cart calculations to use computed prices
  - [ ] Ensure cart persistence (localStorage) includes new fields
  - [ ] Update order submission to include variant details

---

### Phase 5: Testing & Quality Assurance

#### Task 5.1: Unit Tests
- **File**: Create test files
- **Actions**:
  - [ ] Test `calculateVariantPrice` with various scenarios:
    - Single variant
    - Multiple variants
    - Positive and negative price changes
    - Edge cases (no variants, empty selections)
  - [ ] Test `isVariantCombinationAvailable`:
    - Available combinations
    - Disabled combinations
    - Partial selections
  - [ ] Test `getAllPossibleCombinations`:
    - Single variant option
    - Multiple variant options
    - Empty variants

#### Task 5.2: Integration Tests
- **Actions**:
  - [ ] Test admin panel workflow:
    - Create product with variants
    - Drag-and-drop reordering
    - Edit variant values
    - Set combination rules
    - Save and verify in Firestore
  - [ ] Test shop workflow:
    - Select variants
    - See price updates
    - Add to cart with variants
    - Complete checkout
    - Verify order details

#### Task 5.3: User Acceptance Testing
- **Actions**:
  - [ ] Create test products with various variant configurations:
    - Simple (1 variant: Size)
    - Complex (3+ variants: Size, Color, Material)
    - With disabled combinations
    - With price increases/decreases
  - [ ] Test on different devices (mobile, tablet, desktop)
  - [ ] Test on different browsers (Chrome, Firefox, Safari)
  - [ ] Gather feedback from stakeholders

#### Task 5.4: Edge Cases & Error Handling
- **Actions**:
  - [ ] Test with invalid data:
    - Missing required fields
    - Negative prices after adjustments
    - Circular dependencies in rules
  - [ ] Test performance:
    - Products with 100+ variant combinations
    - Drag-and-drop with many items
  - [ ] Test error scenarios:
    - Network failures during save
    - Concurrent edits by multiple admins
    - Database constraints violations

---

## 🧹 Cleanup Tasks

### Remove Deprecated Code
- [ ] Remove old variant management code from `AdminCombos.tsx`
- [ ] Remove `variantImages: Record<string, string>` field (replaced by `VariantValue.imageUrl`)
- [ ] Update any hard-coded references to old variant structure
- [ ] Remove temporary migration code after deployment

### Code Quality
- [ ] Run linter and fix all warnings: `npm run lint`
- [ ] Format all modified files: `npm run format` (if using Prettier)
- [ ] Add JSDoc comments to new utility functions
- [ ] Update component prop types documentation
- [ ] Remove console.logs and debug code

### Documentation
- [ ] Update `README.md` with new variant system overview
- [ ] Create `docs/VARIANTS_GUIDE.md` with:
  - How to create products with variants
  - How to manage combinations
  - Pricing logic explanation
  - Screenshots/GIFs of UI
- [ ] Update `ADMIN_SETUP.md` if relevant
- [ ] Add inline code comments for complex logic

### Database
- [ ] Back up production database before migration
- [ ] Run migration script on production (if applicable)
- [ ] Verify data integrity after migration
- [ ] Monitor Firestore costs (reads/writes may increase slightly)
- [ ] Set up alerts for anomalies

---

## 📦 Dependencies

### Required NPM Packages
```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "uuid": "^9.0.1" // For generating unique IDs
}
```

### Installation Command
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities uuid
npm install --save-dev @types/uuid
```

---

## 🎨 UI/UX Design Guidelines

### Variant Manager Design
```
┌─────────────────────────────────────────────────┐
│ Biến thể sản phẩm                    [+ Thêm]  │
├─────────────────────────────────────────────────┤
│ ≡ Size ☑ Bắt buộc                      [✕]     │
│   ┌───────────────────────────────────────────┐ │
│   │ ≡ Small        -5,000₫  [🖼️] [✕]         │ │
│   │ ≡ Medium            0₫  [🖼️] [✕]         │ │
│   │ ≡ Large       +10,000₫  [🖼️] [✕]         │ │
│   │ [+ Thêm giá trị]                          │ │
│   └───────────────────────────────────────────┘ │
│                                                 │
│ ≡ Color ☑ Bắt buộc                     [✕]     │
│   ┌───────────────────────────────────────────┐ │
│   │ ≡ Red              0₫  [🖼️] [✕]          │ │
│   │ ≡ Blue             0₫  [🖼️] [✕]          │ │
│   │ [+ Thêm giá trị]                          │ │
│   └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Combination Rules Design
```
┌─────────────────────────────────────────────────┐
│ Quản lý kết hợp biến thể                        │
│ [🔍 Tìm kiếm] [✓ Bật tất cả] [✕ Tắt tất cả]  │
├─────────────────────────────────────────────────┤
│ ☑ Small + Red          [Lý do] [Giá tùy chỉnh] │
│ ☑ Small + Blue         [Lý do] [Giá tùy chỉnh] │
│ ☐ Medium + Red         Hết hàng  +2,000₫       │
│ ☑ Medium + Blue        [Lý do] [Giá tùy chỉnh] │
│ ☑ Large + Red          [Lý do] [Giá tùy chỉnh] │
│ ☑ Large + Blue         [Lý do] [Giá tùy chỉnh] │
└─────────────────────────────────────────────────┘
```

### Shop Variant Selection Design
```
┌─────────────────────────────────────────────────┐
│ Áo Thun Premium                                 │
│ 150,000₫ → 165,000₫                            │
├─────────────────────────────────────────────────┤
│ Size:                                           │
│ [Small -5,000₫] [Medium] [Large +10,000₫]     │
│                                                 │
│ Color:                                          │
│ [Red] [Blue] [Green]                           │
│                                                 │
│ Tổng: 165,000₫                                 │
│ (Giá gốc 150,000₫ + Size Large +10,000₫       │
│  + Màu sắc +5,000₫)                            │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migration script tested
- [ ] Backup created
- [ ] Staging environment tested
- [ ] Performance benchmarks acceptable

### Deployment Steps
1. [ ] Deploy Firestore security rules
2. [ ] Run database migration (if needed)
3. [ ] Deploy new frontend code
4. [ ] Monitor error logs
5. [ ] Verify critical user flows
6. [ ] Announce new feature to users (if applicable)

### Post-Deployment
- [ ] Monitor Firestore usage and costs
- [ ] Monitor error tracking (Sentry, etc.)
- [ ] Collect user feedback
- [ ] Document any issues found
- [ ] Plan iteration improvements

---

## 📊 Success Metrics

### Technical Metrics
- [ ] Admin can create variants in < 2 minutes
- [ ] Drag-and-drop responds in < 100ms
- [ ] Page load time remains < 3 seconds
- [ ] No increase in error rates
- [ ] Firestore costs remain within budget

### User Experience Metrics
- [ ] Reduced cart abandonment at variant selection
- [ ] Increased product variant adoption
- [ ] Positive user feedback on new UI
- [ ] Fewer support tickets about variant confusion

---

## 🔮 Future Enhancements (Out of Scope)

These are ideas for future iterations:

1. **Variant Groups**: Group related variants (e.g., "Physical" vs "Digital")
2. **Conditional Variants**: Show/hide variants based on previous selections
3. **Inventory Tracking**: Track stock per variant combination
4. **Bulk Import**: CSV import for variant data
5. **Variant Templates**: Save common variant setups for reuse
6. **A/B Testing**: Test different variant presentations
7. **AI Suggestions**: Recommend optimal variant pricing
8. **Variant Analytics**: Track which variants sell best
9. **Image Gallery**: Multiple images per variant value
10. **3D Preview**: Show 3D models for physical products

---

## 📞 Support & Questions

For questions or issues during implementation:
- Review this document thoroughly
- Check existing code patterns in the codebase
- Consult React/TypeScript/Firebase documentation
- Test incrementally and commit often
- Document any deviations from this plan

---

## 📝 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-26 | 1.0 | Initial document created | AI Assistant |

---

**End of Instructions Document**

> **Note**: This is a living document. Update it as the implementation progresses and new insights are gained.
