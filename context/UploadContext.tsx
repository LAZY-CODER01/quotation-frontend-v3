"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface UploadConfig {
    url: string;
    formData: FormData;
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
}

interface UploadContextType {
    activeUploads: number;
    uploadFile: (config: UploadConfig) => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
    const [activeUploads, setActiveUploads] = useState(0);

    // Prevent page unload if uploads are active
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (activeUploads > 0) {
                e.preventDefault();
                e.returnValue = ''; // Chrome requires this
            }
        };

        if (activeUploads > 0) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [activeUploads]);

    const uploadFile = useCallback(async ({ url, formData, onSuccess, onError }: UploadConfig) => {
        setActiveUploads(prev => prev + 1);
        try {
            const response = await api.post(url, formData, {
                headers: { "Content-Type": undefined }, // Let browser set boundary
            });
            if (onSuccess) onSuccess(response.data);
        } catch (error) {
            console.error("Upload error via context:", error);
            if (onError) onError(error);
        } finally {
            setActiveUploads(prev => Math.max(0, prev - 1));
        }
    }, []);

    return (
        <UploadContext.Provider value={{ activeUploads, uploadFile }}>
            {children}
            {/* Optional: Global Upload Indicator */}
            {activeUploads > 0 && (
                <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-xl z-[100] flex items-center gap-3 animate-pulse">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm font-medium">Uploading {activeUploads} file(s)...</span>
                </div>
            )}
        </UploadContext.Provider>
    );
}

export function useUpload() {
    const context = useContext(UploadContext);
    if (context === undefined) {
        throw new Error('useUpload must be used within an UploadProvider');
    }
    return context;
}
