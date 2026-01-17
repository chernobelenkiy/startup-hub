/**
 * Role translation utilities
 * Shared across project-card and project-detail components
 */

/**
 * Predefined roles that have translations in the i18n system
 */
export const PREDEFINED_ROLES = [
  "developer",
  "designer",
  "marketer",
  "productManager",
  "cofounder",
  "investor",
  "advisor",
] as const;

export type PredefinedRole = (typeof PREDEFINED_ROLES)[number];

/**
 * Check if a role is a predefined role with translation
 */
export function isPredefinedRole(role: string): role is PredefinedRole {
  return PREDEFINED_ROLES.includes(role as PredefinedRole);
}

/**
 * Create a role translator function
 * @param translator - The translation function from next-intl (useTranslations("roles"))
 * @returns A function that translates predefined roles or returns the original string
 */
export function createRoleTranslator(
  translator: (key: PredefinedRole) => string
): (role: string) => string {
  return (role: string): string => {
    if (isPredefinedRole(role)) {
      return translator(role);
    }
    return role;
  };
}
