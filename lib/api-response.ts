import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { MCPErrorCode, MCP_ERROR_CODES } from "@/lib/mcp-auth";
import { RateLimitStatus, createRateLimitHeaders } from "@/lib/rate-limit";

/**
 * MCP API Response Utilities
 *
 * Provides consistent JSON response format for all MCP API endpoints.
 */

/**
 * Generate a unique request ID using nanoid
 * Format: req_<12-character-id>
 */
export function generateRequestId(): string {
  return `req_${nanoid(12)}`;
}

/**
 * Metadata included in all responses
 */
export interface ResponseMeta {
  timestamp: string;
  requestId: string;
}

/**
 * Successful response format
 */
export interface SuccessResponse<T> {
  data: T;
  meta: ResponseMeta;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: string;
  code: MCPErrorCode;
  details?: Record<string, unknown>;
  meta: ResponseMeta;
}

/**
 * Generate response metadata with unique request ID
 */
function generateMeta(requestId?: string): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: requestId ?? generateRequestId(),
  };
}

/**
 * HTTP status codes mapped to error codes
 */
const ERROR_STATUS_CODES: Record<MCPErrorCode, number> = {
  [MCP_ERROR_CODES.UNAUTHORIZED]: 401,
  [MCP_ERROR_CODES.FORBIDDEN]: 403,
  [MCP_ERROR_CODES.NOT_FOUND]: 404,
  [MCP_ERROR_CODES.RATE_LIMITED]: 429,
  [MCP_ERROR_CODES.VALIDATION_ERROR]: 400,
  [MCP_ERROR_CODES.INTERNAL_ERROR]: 500,
};

/**
 * Options for API response creation
 */
export interface ResponseOptions {
  /** Rate limit status to include in headers */
  rateLimit?: RateLimitStatus;
  /** Request ID for tracing */
  requestId?: string;
  /** Additional headers */
  headers?: Headers | Record<string, string>;
}

/**
 * Create a successful API response
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @param options - Additional response options
 * @returns NextResponse with formatted JSON
 */
export function apiSuccess<T>(
  data: T,
  status: number = 200,
  options: ResponseOptions = {}
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    data,
    meta: generateMeta(options.requestId),
  };

  const headers = new Headers(options.headers);

  // Add rate limit headers if provided
  if (options.rateLimit) {
    const rateLimitHeaders = createRateLimitHeaders(options.rateLimit);
    rateLimitHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  // Set content type
  headers.set("Content-Type", "application/json");

  return NextResponse.json(response, { status, headers });
}

/**
 * Create an error API response
 *
 * @param error - Error message
 * @param code - Error code
 * @param details - Optional additional error details
 * @param options - Additional response options
 * @returns NextResponse with formatted error JSON
 */
export function apiError(
  error: string,
  code: MCPErrorCode,
  details?: Record<string, unknown>,
  options: ResponseOptions = {}
): NextResponse<ErrorResponse> {
  const status = ERROR_STATUS_CODES[code] ?? 500;

  const response: ErrorResponse = {
    error,
    code,
    ...(details && { details }),
    meta: generateMeta(options.requestId),
  };

  const headers = new Headers(options.headers);

  // Add rate limit headers if provided
  if (options.rateLimit) {
    const rateLimitHeaders = createRateLimitHeaders(options.rateLimit);
    rateLimitHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  // Set content type
  headers.set("Content-Type", "application/json");

  return NextResponse.json(response, { status, headers });
}

/**
 * Create an unauthorized error response
 */
export function apiUnauthorized(
  message: string = "Unauthorized",
  options: ResponseOptions = {}
): NextResponse<ErrorResponse> {
  return apiError(message, MCP_ERROR_CODES.UNAUTHORIZED, undefined, options);
}

/**
 * Create a forbidden error response
 */
export function apiForbidden(
  message: string = "Forbidden",
  options: ResponseOptions = {}
): NextResponse<ErrorResponse> {
  return apiError(message, MCP_ERROR_CODES.FORBIDDEN, undefined, options);
}

/**
 * Create a not found error response
 */
export function apiNotFound(
  message: string = "Not found",
  options: ResponseOptions = {}
): NextResponse<ErrorResponse> {
  return apiError(message, MCP_ERROR_CODES.NOT_FOUND, undefined, options);
}

/**
 * Create a rate limited error response
 */
export function apiRateLimited(
  rateLimit: RateLimitStatus,
  message: string = "Too many requests",
  options: ResponseOptions = {}
): NextResponse<ErrorResponse> {
  return apiError(
    message,
    MCP_ERROR_CODES.RATE_LIMITED,
    { retryAfter: rateLimit.retryAfter },
    { ...options, rateLimit }
  );
}

/**
 * Create a validation error response
 */
export function apiValidationError(
  message: string = "Validation failed",
  details?: Record<string, unknown>,
  options: ResponseOptions = {}
): NextResponse<ErrorResponse> {
  return apiError(message, MCP_ERROR_CODES.VALIDATION_ERROR, details, options);
}

/**
 * Create an internal error response
 */
export function apiInternalError(
  message: string = "Internal server error",
  options: ResponseOptions = {}
): NextResponse<ErrorResponse> {
  return apiError(message, MCP_ERROR_CODES.INTERNAL_ERROR, undefined, options);
}

/**
 * Log API request for debugging
 */
export function logApiRequest(
  method: string,
  path: string,
  tokenId: string,
  userId: string
): void {
  console.log(
    `[MCP API] ${new Date().toISOString()} | ${method} ${path} | token=${tokenId.slice(0, 8)}... | user=${userId.slice(0, 8)}...`
  );
}

/**
 * Log API error for debugging
 */
export function logApiError(
  method: string,
  path: string,
  error: unknown,
  code: MCPErrorCode,
  requestId?: string
): void {
  const reqIdStr = requestId ? ` | requestId=${requestId}` : "";
  console.error(
    `[MCP API ERROR] ${new Date().toISOString()} | ${method} ${path} | code=${code}${reqIdStr}`,
    error
  );
}
