const API_BASE = '/api';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

class ApiService {
    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem('safemed_token');
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('safemed_token', token);
        } else {
            localStorage.removeItem('safemed_token');
        }
    }

    getToken(): string | null {
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || {
                        code: 'UNKNOWN_ERROR',
                        message: 'An unexpected error occurred.',
                    },
                };
            }

            return data;
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: 'Unable to connect to server. Please check your connection.',
                },
            };
        }
    }

    // ─── Auth ──────────────────────────────────────────────────────────────────

    async register(name: string, email: string, password: string) {
        const res = await this.request<{ token: string; user: any }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        if (res.success && res.data) {
            this.setToken(res.data.token);
        }
        return res;
    }

    async login(email: string, password: string) {
        const res = await this.request<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (res.success && res.data) {
            this.setToken(res.data.token);
        }
        return res;
    }

    async getMe() {
        return this.request<{ user: any }>('/auth/me');
    }

    logout() {
        this.setToken(null);
    }

    // ─── Profile ───────────────────────────────────────────────────────────────

    async getProfile() {
        return this.request<{ riskProfile: any }>('/profile');
    }

    async updateProfile(profile: { age: string; conditions: string[]; allergies: string[] }) {
        return this.request<{ riskProfile: any }>('/profile', {
            method: 'PUT',
            body: JSON.stringify(profile),
        });
    }

    // ─── Interactions ──────────────────────────────────────────────────────────

    async checkInteraction(medication: string, food: string) {
        return this.request<{ interaction: any }>('/interactions/check', {
            method: 'POST',
            body: JSON.stringify({ medication, food }),
        });
    }

    async getHistory(page: number = 1, limit: number = 50) {
        return this.request<{ interactions: any[]; pagination: any }>(
            `/interactions/history?page=${page}&limit=${limit}`
        );
    }

    // ─── Chat ─────────────────────────────────────────────────────────────────

    async sendChatMessage(sessionId: string, message: string, language: 'en' | 'hi' = 'en') {
        return this.request<{ reply: string }>('/chat/chat', {
            method: 'POST',
            body: JSON.stringify({ sessionId, message, language }),
        });
    }
}

// Singleton instance
export const api = new ApiService();
