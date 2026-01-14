# Multilingual Project Fields - Test Cases

## Overview

This document defines test cases for the multilingual project fields implementation, covering translation utilities, validation schemas, and integration behavior.

## Test Files

- `/tests/unit/project-translations.test.ts` - Translation utility functions
- `/tests/unit/project-validation-translations.test.ts` - Validation schemas for translations

---

## Test Cases

### Translation Utilities (`lib/translations/project-translations.ts`)

#### TC-TRANS-001: getBestTranslation returns exact locale match
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: When user requests locale "en" and "en" translation exists, return "en" translation
- **Expected Result**: Returns translation with matching language

#### TC-TRANS-002: getBestTranslation falls back to Russian
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: When user requests locale "en" but only "ru" exists, fall back to Russian
- **Expected Result**: Returns Russian translation as fallback

#### TC-TRANS-003: getBestTranslation falls back to first available
- **Type**: Unit
- **Priority**: P1
- **Status**: Implemented
- **Details**: When user requests unsupported locale and no Russian exists, return first translation
- **Expected Result**: Returns first available translation in array

#### TC-TRANS-004: getBestTranslation returns undefined for empty
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: When translations array is empty or null, return undefined
- **Expected Result**: Returns undefined

#### TC-TRANS-005: resolveProjectTranslation merges translation
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: Merges translation fields (title, shortDescription, pitch, etc.) into project object
- **Expected Result**: Returns project with translated fields

#### TC-TRANS-006: resolveProjectTranslation falls back to legacy
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: When no translations exist, fall back to project's legacy fields
- **Expected Result**: Returns project with legacy field values

#### TC-TRANS-007: getAvailableLanguages returns supported only
- **Type**: Unit
- **Priority**: P1
- **Status**: Implemented
- **Details**: Returns only "en" and "ru" from translations array
- **Expected Result**: Array containing only supported language codes

#### TC-TRANS-008: getAvailableLanguages filters unsupported
- **Type**: Unit
- **Priority**: P1
- **Status**: Implemented
- **Details**: Filters out any unsupported language codes from translations
- **Expected Result**: Empty array or array with only supported languages

---

### Validation Schemas (`lib/validations/project.ts`)

#### TC-VAL-TRANS-001: translationFieldsSchema validates complete translation
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: Accepts translation with title (3-100 chars), shortDescription (10-280 chars), pitch (20-5000 chars)
- **Expected Result**: Validation passes

#### TC-VAL-TRANS-002: translationFieldsSchema rejects missing fields
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: Rejects translation missing title, shortDescription, or pitch
- **Expected Result**: Validation fails with appropriate field errors

#### TC-VAL-TRANS-003: translationsSchema requires one complete translation
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: At least one language (en or ru) must have complete translation
- **Expected Result**: Validation passes if one language is complete

#### TC-VAL-TRANS-004: translationsSchema rejects empty object
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: Empty translations object {} should fail validation
- **Expected Result**: Validation fails with "at least one complete translation" error

#### TC-VAL-TRANS-005: translationsSchema accepts both languages
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: Both en and ru translations can be provided and complete
- **Expected Result**: Validation passes

#### TC-VAL-TRANS-006: createProjectWithTranslationsSchema validates full project
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: Validates project with translations, websiteUrl, status, tags, etc.
- **Expected Result**: Validation passes for valid project with translations

#### TC-VAL-TRANS-007: updateTranslationSchema validates language parameter
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: Language field is required and must be "en" or "ru"
- **Expected Result**: Validation fails without language, passes with valid language

#### TC-VAL-TRANS-008: Field length validations
- **Type**: Unit
- **Priority**: P1
- **Status**: Implemented
- **Details**:
  - title: min 3, max 100 characters
  - shortDescription: min 10, max 280 characters
  - pitch: min 20, max 5000 characters
- **Expected Result**: Validation enforces all length constraints

---

### Translation Resolution Scenarios

#### TC-SCENARIO-001: User locale "en", only "ru" exists
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: When user prefers English but only Russian translation exists
- **Expected Result**: Returns Russian translation content

#### TC-SCENARIO-002: User locale "ru", both exist
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: When user prefers Russian and both translations exist
- **Expected Result**: Returns Russian translation content

#### TC-SCENARIO-003: User locale "en", both exist
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: When user prefers English and both translations exist
- **Expected Result**: Returns English translation content

#### TC-SCENARIO-004: No translations exist
- **Type**: Unit
- **Priority**: P0
- **Status**: Implemented
- **Details**: Project has no translations array
- **Expected Result**: Falls back to legacy project fields

---

## Integration Test Updates

The following existing integration tests were updated to support translations:

### projects.test.ts Updates
- **GET /api/projects**: Now creates mock projects with translations using `createMockProjectWithTranslations`
- **POST /api/projects**: Mock responses include translations array
- Tests verify `include: { translations: true }` in Prisma queries

---

## Test Helpers Added

New helper functions in `/tests/utils/helpers.ts`:

- `createMockProjectTranslation(language, overrides)` - Creates mock ProjectTranslation
- `createMockProjectWithTranslations(languages, overrides)` - Creates project with translations
- `createValidTranslationInput(language)` - Valid translation input data
- `createValidTranslationsInput(languages)` - Valid translations object
- `createValidProjectWithTranslationsInput(languages)` - Valid project with translations

---

## Coverage Summary

| Category | Test Count | Status |
|----------|-----------|--------|
| Translation Utilities | 31 tests | All Pass |
| Validation Schemas | 46 tests | All Pass |
| Integration (updated) | 13 tests | All Pass |
| **Total New/Updated** | **90 tests** | **All Pass** |
