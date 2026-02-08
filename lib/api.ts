import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";
import Cookies from "js-cookie";
import { requestStore } from "./requestStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    // REMOVED: Do not set Content-Type globally here if you upload files
    // headers: {
    //    "Content-Type": "application/json",
    // },
});

// Request Interceptor: Attach Token & Handle Headers
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // IGNORE Global Loading for Polling Request (e.g. GET /emails?days=10)
        const isPolling = config.url?.includes("/emails") && config.params?.days == 10;

        if (!isPolling) {
            requestStore.increment();
        } else {
            (config as any)._skipGlobalLoading = true;
        }

        const token = Cookies.get("token");

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // ✅ THE FIX: Switch Content-Type based on data type
        if (config.data instanceof FormData) {
            // Let the browser set Content-Type (multipart/form-data + boundary)
            if (config.headers) {
                delete config.headers["Content-Type"];
            }
        } else {
            // Default to JSON for all other requests
            if (config.headers && !config.headers["Content-Type"]) {
                config.headers["Content-Type"] = "application/json";
            }
        }

        return config;
    },
    (error: AxiosError) => {
        if (error.config && !(error.config as any)._skipGlobalLoading) {
            requestStore.decrement();
        }
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 (Unauthorized)
api.interceptors.response.use(
    (response) => {
        if (!(response.config as any)._skipGlobalLoading) {
            requestStore.decrement();
        }
        return response;
    },
    (error: AxiosError) => {
        if (error.config && !(error.config as any)._skipGlobalLoading) {
            requestStore.decrement();
        }
        if (error.response && error.response.status === 401) {
            if (typeof window !== "undefined") {
                Cookies.remove("token");
                Cookies.remove("user");
                if (!window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;