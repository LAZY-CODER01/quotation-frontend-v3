"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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
    allUsers: string[]; // ✅ Store users list globally
    login: (token: string, userData: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    refreshUsers: () => Promise<void>; // ✅ Helper to manually refresh list
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<string[]>([]); // ✅ State for users
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // ✅ Helper function to fetch users (Only for Admins)
    const fetchUsersList = useCallback(async () => {
        try {
            const response = await api.get('/users/list');
            if (response.data.success) {
                setAllUsers(response.data.users);
            }
        } catch (err) {
            console.error("Failed to fetch users list", err);
        }
    }, []);

    const checkAuth = async () => {
        try {
            const token = Cookies.get("token");
            const userCookie = Cookies.get("user");

            if (token && userCookie) {
                const parsedUser = JSON.parse(userCookie);
                setUser(parsedUser);
                
                // ✅ Fetch list immediately if Admin
                if (parsedUser.role === 'ADMIN') {
                    fetchUsersList();
                }
            } else {
                setUser(null);
                setAllUsers([]);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            logout(); // Safety logout on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (token: string, userData: User) => {
        Cookies.set("token", token, { expires: 1 });
        Cookies.set("user", JSON.stringify(userData), { expires: 1 });
        setUser(userData);
        
        // ✅ Fetch list on login if Admin
        if (userData.role === 'ADMIN') {
            fetchUsersList();
        }
        
        router.push("/");
    };

    const logout = () => {
        Cookies.remove("token");
        Cookies.remove("user");
        setUser(null);
        setAllUsers([]); // Clear sensitive data
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            allUsers, // ✅ Expose to app
            login, 
            logout, 
            checkAuth,
            refreshUsers: fetchUsersList 
        }}>
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