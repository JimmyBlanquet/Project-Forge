# Technical Plan: Task Priority System

**Version**: 1.0.0
**Created**: 2026-01-18
**Based on**: constitution.yml, spec.md

## Tech Stack

- **Framework**: Next.js 14.0.4 (App Router)
- **Language**: TypeScript 5.3.3 (strict mode)
- **Database**: PostgreSQL 15+ (Supabase)
- **Styling**: Tailwind CSS 3.4+
- **Validation**: Zod 3.22+
- **Testing**: Vitest + React Testing Library

## Database Schema

### Migration: Add Priority Column

```sql
-- Add priority column to tasks table
ALTER TABLE tasks
ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM'
CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'));

-- Add index for filtering performance
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Add composite index for priority + status queries
CREATE INDEX idx_tasks_priority_status ON tasks(priority, status);
```

## Type Definitions

### src/types/task.ts

```typescript
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;  // NEW
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;  // NEW
}

export interface TaskSortOptions {
  field: 'created_at' | 'updated_at' | 'priority';  // NEW
  order: 'asc' | 'desc';
}
```

## Component Structure

```
src/
├── components/
│   ├── tasks/
│   │   ├── TaskCard.tsx           # UPDATE: Add PriorityBadge
│   │   ├── TaskForm.tsx           # UPDATE: Add PrioritySelector
│   │   ├── TaskFilters.tsx        # UPDATE: Add priority filter
│   │   ├── TaskSort.tsx           # UPDATE: Add priority sort
│   │   ├── PriorityBadge.tsx      # NEW: Visual priority indicator
│   │   └── PrioritySelector.tsx   # NEW: Dropdown for priority selection
├── lib/
│   ├── validations/
│   │   └── task.ts                # UPDATE: Add priority validation
│   └── services/
│       └── taskService.ts         # UPDATE: Add priority filtering/sorting
├── app/
│   └── tasks/
│       ├── page.tsx               # UPDATE: Handle priority filters
│       └── [id]/
│           └── edit/
│               └── page.tsx       # UPDATE: Include priority in form
```

## API Changes

### Existing Endpoints (Updated)

**GET /api/tasks**
- Add `priority` query parameter
- Add `sortBy=priority` support
```typescript
Query params:
  ?status=active
  &priority=HIGH      // NEW
  &sortBy=priority    // NEW
  &order=desc
```

**POST /api/tasks**
- Add `priority` to request body
```typescript
Body: {
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';  // NEW (required, default: MEDIUM)
}
```

**PATCH /api/tasks/[id]**
- Allow updating `priority`
```typescript
Body: {
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';  // NEW
  // ... other fields
}
```

## Validation Schema

### lib/validations/task.ts

```typescript
import { z } from 'zod';

export const TaskPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: TaskPrioritySchema.default('MEDIUM'),  // NEW
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskFiltersSchema = z.object({
  status: z.enum(['active', 'completed']).optional(),
  priority: TaskPrioritySchema.optional(),  // NEW
});
```

## UI/UX Design

### Priority Color Scheme
- **HIGH**: Red badge (bg-red-100, text-red-800, border-red-300)
- **MEDIUM**: Yellow badge (bg-yellow-100, text-yellow-800, border-yellow-300)
- **LOW**: Blue badge (bg-blue-100, text-blue-800, border-blue-300)

### Priority Icons
- HIGH: ⬆️ (arrow up) or 🔴 (red circle)
- MEDIUM: ➡️ (arrow right) or 🟡 (yellow circle)
- LOW: ⬇️ (arrow down) or 🔵 (blue circle)

## File Changes Summary

### Database
- `db/migrations/YYYYMMDD_add_priority_to_tasks.sql` - NEW

### Types
- `src/types/task.ts` - UPDATE (add TaskPriority)

### Components (NEW)
- `src/components/tasks/PriorityBadge.tsx`
- `src/components/tasks/PrioritySelector.tsx`

### Components (UPDATE)
- `src/components/tasks/TaskCard.tsx`
- `src/components/tasks/TaskForm.tsx`
- `src/components/tasks/TaskFilters.tsx`
- `src/components/tasks/TaskSort.tsx`

### Services
- `src/lib/services/taskService.ts` - UPDATE (add priority filtering/sorting)

### Validation
- `src/lib/validations/task.ts` - UPDATE (add priority schemas)

### Pages
- `src/app/tasks/page.tsx` - UPDATE (priority filters)
- `src/app/tasks/[id]/edit/page.tsx` - UPDATE (priority selector)

## Implementation Notes

1. **Database First**: Add priority column before updating code
2. **Type Safety**: Update TypeScript types immediately after DB migration
3. **Services**: Update service layer before UI components
4. **Components**: Build PriorityBadge and PrioritySelector first (reusable)
5. **Integration**: Add to TaskCard, TaskForm last
6. **Testing**: Verify in browser using dev-browser skill after UI changes

## Testing Strategy

### Unit Tests
- TaskPriority enum validation
- Priority filtering logic
- Priority sorting logic

### Integration Tests
- Create task with priority → verify DB
- Update task priority → verify changes persist
- Filter by priority → verify correct tasks returned

### Browser Tests
- Priority selector renders correctly
- Priority badge shows correct color
- Filter dropdown works
- Sort by priority orders correctly

## Rollout Plan

### Phase 1: Database + Types
1. Run migration to add priority column
2. Update Task type definition
3. Verify typecheck passes

### Phase 2: Service Layer
1. Update validation schemas
2. Update taskService with priority support
3. Unit test priority filtering/sorting

### Phase 3: UI Components
1. Build PriorityBadge component
2. Build PrioritySelector component
3. Verify components in Storybook/isolation

### Phase 4: Integration
1. Add priority to TaskForm
2. Add PriorityBadge to TaskCard
3. Add priority to TaskFilters
4. Add priority to TaskSort
5. Verify full flow in browser

## Performance Considerations

- Priority index on tasks table ensures fast filtering
- Composite index (priority + status) optimizes common queries
- Priority data loaded with tasks (no extra queries)
- Client-side sort for small datasets (<1000 tasks)
- Server-side sort for large datasets

## Accessibility

- Priority badges have `aria-label="Priority: High"`
- Color blind friendly (icons + text labels)
- Keyboard navigation for priority selector
- Screen reader announces priority changes

## Browser Compatibility

- Priority selector: Native HTML select (universal support)
- Priority badge: Simple CSS (no modern features required)
- Icons: SVG or emoji (both widely supported)
