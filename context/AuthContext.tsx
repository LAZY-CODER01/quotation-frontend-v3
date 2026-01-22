"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import api from "../lib/api";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = Cookies.get("token");
            const userCookie = Cookies.get("user");

            if (token && userCookie) {
                // Verify token validity with an API call if desired, or just trust existence for now
                // Ideally we call /auth/me
                try {
                    // Optional: verify token
                    // await api.get('/auth/me'); 
                    setUser(JSON.parse(userCookie));
                } catch (err) {
                    console.error("Token invalid", err);
                    logout();
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed", error);
        } finally {
            setLoading(false);
        }
    };

    const login = (token: string, userData: User) => {
        Cookies.set("token", token, { expires: 1 }); // 1 day
        Cookies.set("user", JSON.stringify(userData), { expires: 1 });
        setUser(userData);
        router.push("/");
    };

    const logout = () => {
        Cookies.remove("token");
        Cookies.remove("user");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
