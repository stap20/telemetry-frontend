// cypod-telemetry
// src/core/http/api-error.ts

// note: the frontend classifies failures by WHAT WENT WRONG, not by status number. Views ask
// `error.kind === 'unauthorized'`, never `error.status === 401`. The distinction matters because the
// same meaning can arrive as more than one status over time, and because a view that switches on
// raw numbers has quietly re-implemented HTTP in its render function.
export type ApiErrorKind =
    | 'network'
    | 'unauthorized'
    | 'forbidden'
    | 'notFound'
    | 'conflict'
    | 'validation'
    | 'rateLimited'
    | 'server'
    | 'unknown';

// The envelope the backend's global exception filter emits for every failure.
export interface BackendErrorEnvelope {
    statusCode: number;
    message: string;
    errorCode: string;
    locale: string;
    timestamp: string;
    path: string;
    method: string;
}

const KIND_BY_STATUS: Record<number, ApiErrorKind> = {
    400: 'validation',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'notFound',
    409: 'conflict',
    429: 'rateLimited',
};

// Fallback copy for when the server could not tell us anything useful. Keyed, never hardcoded.
const FALLBACK_KEY_BY_KIND: Record<ApiErrorKind, string> = {
    network: 'errors.network',
    unauthorized: 'errors.unauthorized',
    forbidden: 'errors.forbidden',
    notFound: 'errors.notFound',
    conflict: 'errors.conflict',
    validation: 'errors.validation',
    rateLimited: 'errors.rateLimited',
    server: 'errors.server',
    unknown: 'errors.unknown',
};

// note: Nest's ValidationPipe rejections reach the client as the literal string "Bad Request
// Exception" — the backend's filter strips the field holding the per-property detail and falls back
// to the exception's class-derived message. Rendering that verbatim would put framework vocabulary
// in front of a user, so these placeholders are treated as "the server said nothing" and the
// localized fallback is shown instead. Matching on the exact strings rather than a loose pattern
// keeps a genuine backend message from being suppressed by accident.
const NON_HUMAN_MESSAGES = new Set([
    'Bad Request Exception',
    'Internal Server Error Exception',
    'Http Exception',
    'Unauthorized Exception',
]);

export class ApiError extends Error {
    readonly kind: ApiErrorKind;
    readonly status: number;
    readonly code: string;
    readonly path?: string;

    // note: true when the backend produced a sentence meant for a person. The backend localizes its
    // own errors from Accept-Language, so when it has spoken we show its words rather than
    // maintaining a second, drifting copy of every domain message over here. When it has not, the
    // view falls back to `translationKey`.
    readonly hasServerMessage: boolean;
    readonly translationKey: string;

    constructor(params: {
        kind: ApiErrorKind;
        status: number;
        code: string;
        message?: string;
        path?: string;
    }) {
        const serverMessage = params.message?.trim();
        const usable = Boolean(serverMessage) && !NON_HUMAN_MESSAGES.has(serverMessage!);

        super(usable ? serverMessage! : params.kind);

        this.name = 'ApiError';
        this.kind = params.kind;
        this.status = params.status;
        this.code = params.code;
        this.path = params.path;
        this.hasServerMessage = usable;
        this.translationKey = FALLBACK_KEY_BY_KIND[params.kind];
    }

    static fromResponse(status: number, body: Partial<BackendErrorEnvelope> | null): ApiError {
        const kind: ApiErrorKind = KIND_BY_STATUS[status] ?? (status >= 500 ? 'server' : 'unknown');

        return new ApiError({
            kind,
            status,
            code: body?.errorCode ?? String(status),
            message: body?.message,
            path: body?.path,
        });
    }

    // note: status 0 rather than a made-up 5xx. The request never reached the server, so attributing
    // it to the server would be a lie — and the retry policy treats the two differently.
    static fromNetworkFailure(cause: unknown): ApiError {
        const error = new ApiError({
            kind: 'network',
            status: 0,
            code: 'NETWORK_UNREACHABLE',
        });
        error.cause = cause;
        return error;
    }
}

export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}
