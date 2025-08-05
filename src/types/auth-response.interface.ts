export interface LoginResponse {
    token: string;
    user: {
        userId: string;
        email: string;
        role: string;
    };
}

export interface SignupResponse {
    message: string;
}
