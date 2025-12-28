// ============================================================================
// Shared Library: Response Helpers
// ============================================================================

export type ErrorCode = 
  | 'NOT_AUTHENTICATED'
  | 'NOT_AUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL'
  | 'BAD_REQUEST';

export interface SuccessResponse<T = any> {
  data: T;
  error: null;
  request_id: string;
}

export interface ErrorResponse {
  data: null;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
  request_id: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  error: null;
  request_id: string;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T, 
  requestId?: string,
  status = 200
): Response {
  const response: SuccessResponse<T> = {
    data,
    error: null,
    request_id: requestId || generateRequestId()
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.request_id,
      ...corsHeaders
    }
  });
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: { limit: number; offset: number; total: number },
  requestId?: string
): Response {
  const response: PaginatedResponse<T> = {
    data,
    pagination,
    error: null,
    request_id: requestId || generateRequestId()
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.request_id,
      ...corsHeaders
    }
  });
}

/**
 * Create error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  requestId?: string,
  status?: number
): Response {
  const response: ErrorResponse = {
    data: null,
    error: {
      code,
      message,
      details
    },
    request_id: requestId || generateRequestId()
  };

  // Map error codes to HTTP status codes
  const statusCode = status || getStatusCodeForError(code);

  console.error(`[${response.request_id}] ${code}: ${message}`, details);

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.request_id,
      ...corsHeaders
    }
  });
}

/**
 * Map error code to HTTP status code
 */
function getStatusCodeForError(code: ErrorCode): number {
  switch (code) {
    case 'NOT_AUTHENTICATED':
      return 401;
    case 'NOT_AUTHORIZED':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'VALIDATION_ERROR':
      return 422;
    case 'CONFLICT':
      return 409;
    case 'BAD_REQUEST':
      return 400;
    case 'INTERNAL':
    default:
      return 500;
  }
}

/**
 * Handle errors and return appropriate response
 */
export function handleError(error: any, requestId?: string): Response {
  const rid = requestId || generateRequestId();

  // Authentication/Authorization errors
  if (error.name === 'AuthError') {
    return errorResponse(
      error.code,
      error.message,
      undefined,
      rid
    );
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return errorResponse(
      'VALIDATION_ERROR',
      error.message,
      error.errors,
      rid
    );
  }

  // Database errors
  if (error.code) {
    // PostgreSQL error codes
    if (error.code === '23505') {
      return errorResponse(
        'CONFLICT',
        'Resource already exists',
        { dbError: error.message },
        rid
      );
    }
    if (error.code === '23503') {
      return errorResponse(
        'BAD_REQUEST',
        'Referenced resource does not exist',
        { dbError: error.message },
        rid
      );
    }
    if (error.code === '23502') {
      return errorResponse(
        'VALIDATION_ERROR',
        'Required field is missing',
        { dbError: error.message },
        rid
      );
    }
  }

  // Generic internal error
  console.error(`[${rid}] Unhandled error:`, error);
  
  return errorResponse(
    'INTERNAL',
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? error.message : undefined,
    rid
  );
}

/**
 * CORS headers for Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-request-id, apikey',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle OPTIONS request for CORS
 */
export function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}