import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Plus, Save, Trash2, Loader2, X, Search, Lock, ChevronDown, Check } from "lucide-react";
import Cookies from "js-cookie";
import { EmailExtraction, ExtractionRequirement } from "../../../types/email";
import api from "../../../lib/api";

// --- Types ---

interface RequirementsEditorProps {
  ticket: EmailExtraction;
  onBack: () => void;
  onSave: (updatedRequirements: ExtractionRequirement[]) => void;
}

interface SearchResult {
  row_number: number;
  requirement: string;
  offer: string;
  brand: string;
  price: string | number;
  currency: string;
  unit?: string;
  score: number;
  image_url?: string;
  isManual?: boolean; // New flag for manual entries
}

// --- Helper Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Row Component ---

interface RequirementRowProps {
  index: number;
  item: ExtractionRequirement;
  onUpdate: (index: number, updates: Partial<ExtractionRequirement>) => void;
  onDelete: (index: number) => void;
}

const RequirementRow = ({ index, item, onUpdate, onDelete }: RequirementRowProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Use matches from item if available, otherwise empty
  // We apply the Filter and Deduplicate logic here too, in case bad data was saved
  const rawResults: SearchResult[] = item.matches || [];
  const searchResults = (() => {
    const unique: SearchResult[] = [];
    const seen = new Set<string>();

    // Always include current manual selection if it exists and isn't just empty
    // But deduplicate it against the list
    if (item.selectedMatch && item.selectedMatch.isManual && item.selectedMatch.offer) {
      unique.push(item.selectedMatch);
      const normalize = (s: string) => s.trim().toLowerCase();
      seen.add(`${normalize(item.selectedMatch.offer)}|${normalize(item.selectedMatch.brand)}|${item.selectedMatch.price}`);
    }

    for (const r of rawResults) {
      // 1. Filter out incomplete offers (must have offer, brand, and price) UNLESS it is manual
      if (!r.isManual) {
        if (!r.offer || !r.offer.trim() || !r.brand || !r.brand.trim() || r.price === undefined || r.price === null || r.price === "") continue;
      }

      // 2. Filter out duplicates based on Offer + Brand + Price
      const normalize = (s: string) => s.trim().toLowerCase();
      const offerKey = `${normalize(r.offer)}|${normalize(r.brand)}|${r.price}`;

      if (!seen.has(offerKey)) {
        seen.add(offerKey);
        unique.push(r);
      }
    }
    return unique;
  })();

  // Logic to determine which offer is "selected"
  // ONLY show if the user has explicitly selected a match (persisted in selectedMatch).
  // We do NOT default to the top result anymore.
  const selectedOffer = item.selectedMatch || null;

  // Debounce the description 
  const debouncedDescription = useDebounce(item.Description, 800);

  // Auto-Search Effect
  useEffect(() => {
    // If we already have matches and the description hasn't drastically changed (assumed handled by parent clearing matches)
    if (item.matches && item.matches.length > 0) return;
    if (!debouncedDescription || debouncedDescription.length < 3) return;

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`https://quotation-service-571563971522.us-central1.run.app/api/search?q=${encodeURIComponent(debouncedDescription)}`, { headers });
        const data = await res.json();

        if (data.success && data.results.length > 0) {
          // Filter and Deduplicate
          const uniqueResults: SearchResult[] = [];
          const seenOffers = new Set<string>();

          for (const result of data.results) {
            // 1. Filter out incomplete offers (must have offer, brand, and price)
            if (!result.offer || !result.offer.trim() || !result.brand || !result.brand.trim() || result.price === undefined || result.price === null || result.price === "") continue;

            // 2. Filter out duplicates based on Offer + Brand + Price
            const normalize = (s: string) => s.trim().toLowerCase();
            const offerKey = `${normalize(result.offer)}|${normalize(result.brand)}|${result.price}`;

            if (!seenOffers.has(offerKey)) {
              seenOffers.add(offerKey);
              uniqueResults.push(result);
            }
          }

          // Save matches to parent state
          // Note calling onUpdate here updates matches only
          onUpdate(index, { matches: uniqueResults });

          // WE NO LONGER AUTO-SELECT or AUTO-FILL
          // User must manually select from the dropdown.
        } else {
          onUpdate(index, { matches: [] });
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [debouncedDescription, item.matches]); // Depend on item.matches so we stop if it gets populated

  const handleSelectOffer = (offer: SearchResult) => {
    // 1. If we are switching AWAY from a manual entry, save it to the matches list so we can switch back
    let updatedMatches = [...(item.matches || [])];
    if (selectedOffer && selectedOffer.isManual && selectedOffer.offer) {
      // Only add if not already in there (check by reference or value?)
      // Let's just push it, the deduplication in render handles display
      // But we modify the state array, so array grows. 
      // Let's check if we already have this exact object or similar.
      const isDuplicate = updatedMatches.some(m => m.offer === selectedOffer.offer && m.brand === selectedOffer.brand && m.price == selectedOffer.price);
      if (!isDuplicate) {
        updatedMatches.unshift(selectedOffer); // Add to top
      }
    }

    // Call onUpdate ONCE with all fields to avoid race conditions
    onUpdate(index, {
      "Unit price": String(offer.price),
      "Unit": offer.unit || item.Unit,
      "selectedMatch": offer,
      matches: updatedMatches // Update matches list
    });
    setIsOpen(false);
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-[#181A1F] border border-white/5 rounded-xl items-start group hover:border-emerald-500/20 transition-all">
      {/* # Number */}
      <div className="col-span-1 flex items-center justify-center pt-3 text-gray-600 font-mono text-sm">
        {index + 1}
      </div>

      {/* Requirement Box */}
      <div className="col-span-4 relative">
        <label className="text-[10px] items-center gap-2 text-gray-500 font-bold uppercase mb-1 hidden group-hover:flex">
          Your Requirement
        </label>
        <div className="relative">
          <textarea
            value={item.Description}
            onChange={(e) => onUpdate(index, { Description: e.target.value })}
            className="w-full bg-[#0F1115] border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none min-h-[80px] resize-none leading-relaxed"
            placeholder="Type requirement..."
          />
          <Lock size={12} className="absolute top-3 right-3 text-gray-700 pointer-events-none" />
        </div>
      </div>

      {/* We Offer Box (Interactive) */}
      <div className="col-span-4 relative">
        <label className="text-[10px] items-center gap-2 text-emerald-500/70 font-bold uppercase mb-1 hidden group-hover:flex">
          We Offer {searchResults.length > 0 && <span className="bg-emerald-500/10 text-emerald-400 px-1.5 rounded text-[9px]">{searchResults.length} matches</span>}
        </label>

        <div className="relative">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full min-h-[80px] bg-[#0F1115] border rounded-lg p-3 cursor-pointer transition-all relative flex flex-col justify-center
                    ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-white/10 hover:border-white/20'}
                `}
          >
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={14} className="animate-spin" /> Searching...
              </div>
            ) : (
              <>
                <div
                  className="flex flex-col w-full pr-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <textarea
                    value={selectedOffer?.offer || ""}
                    onChange={(e) => {
                      // Init empty object if null
                      const currentOffer = selectedOffer || { offer: "", brand: "", price: 0, score: 0, requirement: "", row_number: 0, currency: "" };
                      const newOffer = { ...currentOffer, offer: e.target.value, isManual: true }; // Set isManual
                      onUpdate(index, { selectedMatch: newOffer });
                    }}
                    className="w-full bg-transparent text-sm text-white font-medium focus:outline-none resize-none overflow-hidden"
                    rows={2}
                    placeholder="Type offer description..."
                  />
                  <input
                    value={selectedOffer?.brand || ""}
                    onChange={(e) => {
                      // Init empty object if null
                      const currentOffer = selectedOffer || { offer: "", brand: "", price: 0, score: 0, requirement: "", row_number: 0, currency: "" };
                      const newOffer = { ...currentOffer, brand: e.target.value, isManual: true }; // Set isManual
                      onUpdate(index, { selectedMatch: newOffer });
                    }}
                    className="w-full bg-transparent text-xs text-gray-500 mt-1 focus:outline-none"
                    placeholder="Brand"
                  />
                </div>
                {/* Only show check if actually has data */}
                {selectedOffer && selectedOffer.offer && (
                  <div className="absolute top-3 right-3 text-emerald-500">
                    <Check size={14} />
                  </div>
                )}
              </>
            )}

            <ChevronDown size={14} className={`absolute bottom-3 right-3 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown/Popover for Alternatives */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1D24] border border-white/10 rounded-lg shadow-2xl z-20 overflow-hidden flex flex-col">
              <div className="max-h-[250px] overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {searchResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectOffer(res)}
                        className={`p-3 hover:bg-white/5 cursor-pointer transition-colors flex justify-between items-start gap-3 ${res.isManual ? 'bg-emerald-500/10' : ''}`}
                      >
                        <div className="flex-1">
                          <div className="text-sm text-gray-200">
                            {res.isManual && <span className="text-[10px] bg-emerald-500 text-black px-1 rounded mr-2 font-bold">MANUAL</span>}
                            {res.offer}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{res.brand}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 text-sm font-mono">{res.price}</div>
                          <div className="text-[10px] text-gray-600">{(res.score * 100).toFixed(0)}% Match</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="p-2 border-t border-white/5 bg-[#1A1D24]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Always start with a completely blank manual entry
                    onUpdate(index, {
                      selectedMatch: {
                        offer: "", brand: "", price: 0, score: 0,
                        requirement: item.Description || "", row_number: 0, currency: "",
                        isManual: true
                      }
                    });
                    setIsOpen(false);
                  }}
                  className="w-full py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={12} /> Add Manual Entry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Backdrop to close dropdown */}
        {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />}
      </div>

      {/* QTY */}
      <div className="col-span-1 pt-6">
        <input type="text" value={item.Quantity} onChange={(e) => onUpdate(index, { Quantity: e.target.value })} className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-2 py-2 text-sm text-center text-gray-200 focus:border-emerald-500/50 focus:outline-none placeholder:text-gray-700" placeholder="-" />
      </div>

      {/* UNIT */}
      <div className="col-span-1 pt-6">
        <input type="text" value={item.Unit} onChange={(e) => onUpdate(index, { Unit: e.target.value })} className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-2 py-2 text-sm text-center text-gray-200 focus:border-emerald-500/50 focus:outline-none placeholder:text-gray-700" placeholder="Unit" />
      </div>

      {/* PRICE */}
      <div className="col-span-1 pt-6">
        <input type="text" value={item["Unit price"] || ""} onChange={(e) => onUpdate(index, { "Unit price": e.target.value })} className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-2 py-2 text-sm text-right text-emerald-400 font-medium focus:border-emerald-500/50 focus:outline-none placeholder:text-gray-700" placeholder="0.00" />
      </div>
    </div>
  );
};


// --- Main Editor Component ---

export default function RequirementsEditor({ ticket, onBack, onSave }: RequirementsEditorProps) {
  const [items, setItems] = useState<ExtractionRequirement[]>([]);
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket.extraction_result?.Requirements) {
      setItems(ticket.extraction_result.Requirements);
    } else {
      // Init with one empty line if none
      setItems([{ Description: "", Quantity: "", Unit: "", "Unit price": "" }]);
    }
  }, [ticket]);

  // NEW: Batch update handler to prevent race conditions
  const handleItemUpdate = (index: number, updates: Partial<ExtractionRequirement>) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const item = { ...newItems[index] };

      // If description changed, clear matches but KEEP selectedMatch (manual entry)
      if (updates.Description !== undefined && updates.Description !== item.Description) {
        item.matches = undefined;
        // item.selectedMatch = undefined; // <--- REMOVED: Don't clear manual offer
      }

      // Apply all updates
      Object.assign(item, updates);

      newItems[index] = item;
      return newItems;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { Description: "", Quantity: "", Unit: "", "Unit price": "" }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Strip 'matches' to save space BUT keep manual entries (isManual=true)
      const sanitizedItems = items.map(item => ({
        ...item,
        matches: item.matches,
        // Ensure selectedMatch is preserved if it has content
        selectedMatch: item.selectedMatch && item.selectedMatch.offer ? item.selectedMatch : undefined
      }));

      await api.post('/ticket/update-requirements', { gmail_id: ticket.gmail_id, requirements: sanitizedItems });
      onSave(items); // Keep local state full (with matches if any) for smooth UI
      onBack();
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F1115] z-50 flex flex-col animate-in fade-in duration-200 text-white">

      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0F1115]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white flex items-center gap-3">
            Search & Quote Editor
            <span className="font-mono text-xs font-normal text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">{ticket.ticket_number}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 border border-white/10 transition-colors">
            <Plus size={16} /> Add Line
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 bg-[#121418] text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4">Your Requirement</div>
        <div className="col-span-4">We Offer</div>
        <div className="col-span-1 text-center">Qty</div>
        <div className="col-span-1 text-center">Unit</div>
        <div className="col-span-1 text-right">Price</div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
        <div className="space-y-3">
          {items.map((item, index) => (
            <RequirementRow
              key={index}
              index={index}
              item={item}
              onUpdate={handleItemUpdate} // Using new handler
              onDelete={handleDeleteItem}
            />
          ))}
          <div ref={bottomRef} className="h-20" />
          {/* Extra space at bottom */}
        </div>
      </div>

    </div>
  );
}