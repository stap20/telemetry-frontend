// cypod-telemetry
// src/modules/auth/data/auth.repository.ts
import { httpClient } from '@/core/http/http-client';
import { endpoints } from '@/core/http/endpoints';
import type { AuthenticatedUser, Credentials, Registration } from '../domain/authenticated-user';
import type { AuthResponseDto } from './auth.dto';
import { authMapper } from './auth.mapper';

// note: repositories are the only layer allowed to know that HTTP exists. They take domain input,
// call the shared client, and return domain output — no React, no query keys, no caching. That
// boundary is what lets the service layer above be tested against a fake repository and what keeps
// the DTO vocabulary from leaking upward past this file.
export const authRepository = {
    async login(credentials: Credentials): Promise<AuthenticatedUser> {
        const { data } = await httpClient.post<AuthResponseDto>(
            endpoints.auth.login,
            authMapper.toLoginRequest(credentials),
        );
        return authMapper.toDomain(data);
    },

    async register(registration: Registration): Promise<AuthenticatedUser> {
        const { data } = await httpClient.post<AuthResponseDto>(
            endpoints.auth.register,
            authMapper.toRegisterRequest(registration),
        );
        return authMapper.toDomain(data);
    },

    async logout(): Promise<void> {
        await httpClient.post<void>(endpoints.auth.logout);
    },
};
