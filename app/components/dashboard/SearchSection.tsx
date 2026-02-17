"use client";

import { useState } from "react";
import { Search, Lock } from "lucide-react";
import Cookies from "js-cookie";
import ApiStatusIndicator from "../ui/ApiStatusIndicator";

interface SearchResult {
    row_number: number;
    requirement: string;
    offer: string;
    brand: string;
    price: string | number;
    currency: string;
    unit?: string;
    score: number;
}

export default function SearchSection() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get("token");
            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            // Adjust API URL as needed (e.g. from environment variable)
            const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}`, {
                headers,
            });

            if (!res.ok) {
                throw new Error("Failed to fetch results");
            }

            const data = await res.json();
            if (data.success) {
                setResults(data.results);
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred while searching.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0F1115] text-white p-6">
            {/* Header / Search Bar */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Product Search</h1>
                <div className="flex items-center gap-4">
                    <ApiStatusIndicator />
                </div>
            </div>

            <div className="mb-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for products..."
                            className="w-full pl-10 pr-4 py-3 bg-[#1E1E1E] border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? "Searching..." : "Search"}
                    </button>
                </form>
            </div>

            {/* Results Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#121212] border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="col-span-1">#</div>
                <div className="col-span-4">YOUR REQUIREMENT</div>
                <div className="col-span-4">WE OFFER</div>
                <div className="col-span-1">QTY</div>
                <div className="col-span-1">UNIT</div>
                <div className="col-span-1">PRICE</div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 mt-2">
                {results.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 p-4 bg-[#1E1E1E] rounded-lg border border-gray-800 items-start hover:border-gray-700 transition-colors">

                        {/* # Row Number */}
                        <div className="col-span-1 text-gray-500 font-mono text-sm pt-2">
                            {item.row_number || index + 1}
                        </div>

                        {/* Left Box (Requirement) */}
                        <div className="col-span-4 bg-[#121212] p-3 rounded border border-gray-700 relative group">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.requirement}</p>
                            <Lock size={14} className="absolute top-2 right-2 text-gray-600 opacity-50" />
                        </div>

                        {/* Right Box (We Offer) */}
                        <div className="col-span-4 bg-[#121212] p-3 rounded border border-gray-700 relative">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-emerald-400 font-medium">{item.brand}</span>
                                <p className="text-sm text-white">{item.offer}</p>
                            </div>
                            <Lock size={14} className="absolute top-2 right-2 text-gray-600 opacity-50" />
                        </div>

                        {/* QTY Input */}
                        <div className="col-span-1">
                            <input
                                type="text"
                                className="w-full bg-[#121212] border border-gray-700 rounded p-2 text-center text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
                                placeholder="-"
                            />
                        </div>

                        {/* UNIT Input */}
                        <div className="col-span-1">
                            <input
                                type="text"
                                defaultValue={item.unit || "PCS"}
                                className="w-full bg-[#121212] border border-gray-700 rounded p-2 text-center text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        {/* PRICE Input */}
                        <div className="col-span-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    defaultValue={item.price}
                                    className="w-full bg-[#121212] border border-gray-700 rounded p-2 text-right text-sm text-emerald-400 font-medium focus:border-emerald-500 focus:outline-none"
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 mr-1">{item.currency}</span>
                            </div>
                        </div>

                    </div>
                ))}

                {!loading && results.length === 0 && query && !error && (
                    <div className="text-center text-gray-500 py-10">No results found</div>
                )}

                {error && (
                    <div className="text-center text-red-500 py-10">{error}</div>
                )}
            </div>
        </div>
    );
}
