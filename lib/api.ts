import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = Cookies.get("token");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 (Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response && error.response.status === 401) {
            // Clear token and redirect to login if 401 occurs
            // We avoid using window.location here if possible to keep it SSR safe, 
            // but client-side it's fine.
            if (typeof window !== "undefined") {
                Cookies.remove("token");
                Cookies.remove("user");
                // Only redirect if not already on login page to avoid loops
                if (!window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
