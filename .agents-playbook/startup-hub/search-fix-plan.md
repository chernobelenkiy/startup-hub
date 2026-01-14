# Search Feature Fix - Implementation Plan

## Problem Statement
Фильтры поиска отображают захардкоженные значения вместо реальных данных из базы данных. Пользователи ожидают видеть теги и роли, которые реально существуют в проектах.

## Root Cause Analysis
- `POPULAR_TAGS` и `AVAILABLE_ROLES` в `/components/home/filters.tsx` - это статические константы
- Нет API эндпоинта для получения агрегированных/уникальных значений из БД

### Hardcoded Values Found:

1. **POPULAR_TAGS** (filters.tsx:33-44):
   ```typescript
   const POPULAR_TAGS = [
     "AI", "SaaS", "B2B", "B2C", "Fintech",
     "Healthcare", "EdTech", "E-commerce", "Mobile", "Web3",
   ];
   ```

2. **AVAILABLE_ROLES** (filters.tsx:22-30):
   ```typescript
   const AVAILABLE_ROLES = [
     "developer", "designer", "marketer",
     "productManager", "cofounder", "investor", "advisor",
   ] as const;
   ```

---

## Phase 1: Backend - Create Filter Options API (P0)

### Task 1.1: Create `/api/filters/route.ts` endpoint
**Size:** S (Small) | **Priority:** P0 (Critical)

Создать новый API эндпоинт, возвращающий уникальные теги и роли из всех проектов.

**Структура ответа:**
```json
{
  "tags": [{ "value": "AI", "count": 15 }, ...],
  "roles": [{ "value": "developer", "count": 8 }, ...],
  "statuses": [{ "value": "IDEA", "count": 20 }, ...]
}
```

**Files to create:**
- `/app/api/filters/route.ts`

---

### Task 1.2: Add Prisma queries for aggregation
**Size:** XS | **Priority:** P0

SQL для тегов (массивы):
```sql
SELECT UNNEST(tags) as tag, COUNT(*) as count
FROM projects GROUP BY tag ORDER BY count DESC LIMIT 50
```

SQL для ролей:
```sql
SELECT UNNEST("lookingFor") as role, COUNT(*) as count
FROM projects GROUP BY role ORDER BY count DESC
```

---

## Phase 2: Frontend - Dynamic Filter Options (P0)

### Task 2.1: Create useFilterOptions hook
**Size:** S | **Priority:** P0

**Files to create:**
- `/lib/hooks/use-filter-options.ts`

---

### Task 2.2: Update Filters component
**Size:** M (Medium) | **Priority:** P0

**Changes:**
1. Import и использование `useFilterOptions` hook
2. Замена `POPULAR_TAGS` на динамические теги из API
3. Замена `AVAILABLE_ROLES` на динамические роли из API
4. Добавление loading state для dropdown'ов
5. Сохранение hardcoded values как fallback
6. Сортировка опций по количеству использований

**Files to modify:**
- `/components/home/filters.tsx`

---

### Task 2.3: Update MultiSelect loading states
**Size:** S | **Priority:** P1

**Files to modify:**
- `/components/ui/multi-select.tsx`

---

## Phase 3: Performance Optimization (P1)

### Task 3.1: Implement caching
**Size:** S | **Priority:** P1

- SWR с `revalidateOnFocus: false`
- Cache headers на API

---

## Implementation Summary

| Phase | Tasks | Priority | Total Size |
|-------|-------|----------|------------|
| 1. Backend API | 1.1, 1.2 | P0 | S + XS |
| 2. Frontend | 2.1, 2.2, 2.3 | P0/P1 | S + M + S |
| 3. Caching | 3.1 | P1 | S |

---

## Files Overview

**Create:**
- `/app/api/filters/route.ts` - Filter options API
- `/lib/hooks/use-filter-options.ts` - Data fetching hook

**Modify:**
- `/components/home/filters.tsx` - Replace hardcoded values
- `/components/ui/multi-select.tsx` - Add loading states

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Empty database | Hardcoded fallback values |
| Slow aggregation | Caching |
| Missing translations | Tags are EN-only |

---

## Clarifying Questions

1. **Roles translation?** Роли используют i18n ключи. Динамические роли из БД будут raw strings. Оставить предопределенные роли или разрешить кастомные?

2. **Количество тегов?** Показывать top N популярных или все с виртуальным скроллом?

3. **Real-time updates?** Обновлять опции фильтров при загрузке страницы или при фокусе на фильтр?
