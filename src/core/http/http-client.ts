// cypod-telemetry
// src/core/http/http-client.ts
import { env } from '@/core/config/env';
import { ApiError, type BackendErrorEnvelope } from './api-error';

export type QueryValue = string | number | boolean | null | undefined;

export interface HttpRequest {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    body?: unknown;
    query?: Record<string, QueryValue>;
    headers: Record<string, string>;
    signal?: AbortSignal;
}

export interface HttpResponse<T> {
    data: T;
    status: number;
    headers: Headers;
}

export type RequestInterceptor = (request: HttpRequest) => HttpRequest;
export type ErrorInterceptor = (error: ApiError) => void;

// note: THE single gateway to the backend. Repositories are the only callers and they may not use
// fetch directly — that rule is what makes cross-cutting concerns possible at all. Auth headers,
// the request language, error normalisation and the global 401 response each exist once here
// instead of once per call site, where the fifteenth call site inevitably forgets one of them.
class HttpClient {
    private readonly requestInterceptors: RequestInterceptor[] = [];
    private readonly errorInterceptors: ErrorInterceptor[] = [];

    constructor(private readonly baseUrl: string) {}

    useRequestInterceptor(interceptor: RequestInterceptor): void {
        this.requestInterceptors.push(interceptor);
    }

    // note: error interceptors observe, they do not transform. A hook that could rewrite the error
    // would let one concern (say, session expiry) change what an unrelated view is told went wrong.
    // They exist for side effects — clearing the session, reporting — and the ApiError the caller
    // receives is always the one the server actually described.
    useErrorInterceptor(interceptor: ErrorInterceptor): void {
        this.errorInterceptors.push(interceptor);
    }

    get<T>(path: string, options: Omit<Partial<HttpRequest>, 'method' | 'path'> = {}) {
        return this.send<T>({ ...options, method: 'GET', path, headers: options.headers ?? {} });
    }

    post<T>(path: string, body?: unknown, options: Omit<Partial<HttpRequest>, 'method' | 'path' | 'body'> = {}) {
        return this.send<T>({ ...options, method: 'POST', path, body, headers: options.headers ?? {} });
    }

    private async send<T>(initial: HttpRequest): Promise<HttpResponse<T>> {
        const request = this.requestInterceptors.reduce(
            (carried, intercept) => intercept(carried),
            initial,
        );

        const response = await this.dispatch(request);
        const body = await this.readBody(response);

        if (!response.ok) {
            throw this.reportAndReturn(
                ApiError.fromResponse(response.status, body as BackendErrorEnvelope | null),
            );
        }

        return { data: body as T, status: response.status, headers: response.headers };
    }

    private async dispatch(request: HttpRequest): Promise<Response> {
        try {
            return await fetch(this.buildUrl(request), {
                method: request.method,
                headers: {
                    ...(request.body === undefined ? {} : { 'Content-Type': 'application/json' }),
                    ...request.headers,
                },
                body: request.body === undefined ? undefined : JSON.stringify(request.body),
                // note: without this the browser withholds the session cookie and every guarded
                // call 401s while the user is, as far as they can tell, logged in.
                credentials: 'include',
                signal: request.signal,
            });
        } catch (cause) {
            // note: fetch rejects only when the request never completed — offline, DNS failure, the
            // backend not running. An HTTP error status resolves normally and is handled above, so
            // everything landing here is genuinely "we could not reach the server".
            if (cause instanceof DOMException && cause.name === 'AbortError') {
                throw cause;
            }
            throw this.reportAndReturn(ApiError.fromNetworkFailure(cause));
        }
    }

    private buildUrl(request: HttpRequest): string {
        const url = new URL(`${this.baseUrl}${request.path}`, window.location.origin);

        for (const [key, value] of Object.entries(request.query ?? {})) {
            // note: skipping undefined/null keeps callers from having to assemble query objects
            // conditionally — an absent filter is simply left out rather than sent as "undefined".
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        }

        return url.toString();
    }

    private async readBody(response: Response): Promise<unknown> {
        const isJson = response.headers.get('content-type')?.includes('application/json');
        if (!isJson || response.status === 204) {
            return undefined;
        }

        // note: a body that fails to parse must not become a parse error thrown from deep inside the
        // client — the caller would see a SyntaxError instead of the HTTP failure that caused it.
        return response.json().catch(() => null);
    }

    private reportAndReturn(error: ApiError): ApiError {
        for (const intercept of this.errorInterceptors) {
            intercept(error);
        }
        return error;
    }
}

export const httpClient = new HttpClient(env.apiBaseUrl);
