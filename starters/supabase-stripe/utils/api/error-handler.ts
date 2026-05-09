import { NextResponse } from 'next/server';

type ErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'RATE_LIMITED'
    | 'INTERNAL_ERROR'
    | 'SERVICE_UNAVAILABLE';

const STATUS_MAP: Record<ErrorCode, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 400,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

const MESSAGE_MAP: Record<ErrorCode, string> = {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Invalid request data',
    RATE_LIMITED: 'Too many requests, please try again later',
    INTERNAL_ERROR: 'An unexpected error occurred',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
};

export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
    code: ErrorCode,
    details?: string,
    headers?: Record<string, string>
) {
    return NextResponse.json(
        { success: false, error: { code, message: MESSAGE_MAP[code] } },
        { status: STATUS_MAP[code], headers }
    );
}

type RouteHandler = (
    request: Request,
    context?: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
    return async (request, context) => {
        try {
            return await handler(request, context);
        } catch (error) {
            console.error('[API Error]', {
                method: request.method,
                url: request.url,
                error: error instanceof Error ? error.message : error,
            });
            return apiError('INTERNAL_ERROR');
        }
    };
}
