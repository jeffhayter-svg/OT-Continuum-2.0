// ============================================================================
// Shared Library: Validation Helpers
// ============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: ValidationErrorDetail[] = []
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Validate required fields are present
 */
export function validateRequired(
  data: any,
  fields: string[]
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        message: `${field} is required`
      });
    }
  }

  return errors;
}

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate enum value
 */
export function isValidEnum<T extends string>(
  value: string,
  allowedValues: T[]
): value is T {
  return allowedValues.includes(value as T);
}

/**
 * Validate number range
 */
export function isInRange(
  value: number,
  min?: number,
  max?: number
): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Parse and validate integer from query param
 */
export function parseIntParam(
  value: string | null,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (value === null) return defaultValue;
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  
  return parsed;
}

/**
 * Parse and validate boolean from query param
 */
export function parseBoolParam(
  value: string | null,
  defaultValue: boolean
): boolean {
  if (value === null) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Validate pagination parameters
 */
export function validatePagination(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
} {
  const limit = parseIntParam(searchParams.get('limit'), 20, 1, 100);
  const offset = parseIntParam(searchParams.get('offset'), 0, 0);
  
  return { limit, offset };
}

/**
 * Validate and sanitize input object
 */
export function validateInput<T>(
  data: any,
  schema: {
    required?: string[];
    optional?: string[];
    rules?: Record<string, (value: any) => string | null>;
  }
): T {
  const errors: ValidationErrorDetail[] = [];

  // Check required fields
  if (schema.required) {
    errors.push(...validateRequired(data, schema.required));
  }

  // Validate field rules
  if (schema.rules) {
    for (const [field, rule] of Object.entries(schema.rules)) {
      if (data[field] !== undefined && data[field] !== null) {
        const error = rule(data[field]);
        if (error) {
          errors.push({ field, message: error });
        }
      }
    }
  }

  // Throw if validation errors
  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  // Return only allowed fields
  const allowedFields = [
    ...(schema.required || []),
    ...(schema.optional || [])
  ];

  const sanitized: any = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  }

  return sanitized as T;
}

/**
 * Common validation rules
 */
export const validationRules = {
  uuid: (value: string) => 
    isValidUUID(value) ? null : 'Must be a valid UUID',
  
  email: (value: string) => 
    isValidEmail(value) ? null : 'Must be a valid email address',
  
  minLength: (min: number) => (value: string) =>
    value.length >= min ? null : `Must be at least ${min} characters`,
  
  maxLength: (max: number) => (value: string) =>
    value.length <= max ? null : `Must be at most ${max} characters`,
  
  enum: <T extends string>(allowed: T[]) => (value: string) =>
    isValidEnum(value, allowed) ? null : `Must be one of: ${allowed.join(', ')}`,
  
  range: (min?: number, max?: number) => (value: number) =>
    isInRange(value, min, max) ? null : `Must be between ${min} and ${max}`,
  
  positive: (value: number) =>
    value > 0 ? null : 'Must be a positive number',
  
  url: (value: string) => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Must be a valid URL';
    }
  }
};
