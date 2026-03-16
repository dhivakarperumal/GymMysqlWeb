import React, { useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const DateRangeFilter = ({ onFilterChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState("all");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const ranges = [
    { label: "All Time", value: "all" },
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "this_week" },
    { label: "Last Week", value: "last_week" },
    { label: "This Month", value: "this_month" },
    { label: "Last Month", value: "last_month" },
    { label: "Custom Range", value: "custom" },
  ];

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
    if (range !== "custom") {
      setIsOpen(false);
      calculateAndSend(range);
    }
  };

  const calculateAndSend = (range, custom = null) => {
    let start = null;
    let end = dayjs().endOf("day");

    switch (range) {
      case "today":
        start = dayjs().startOf("day");
        break;
      case "yesterday":
        start = dayjs().subtract(1, "day").startOf("day");
        end = dayjs().subtract(1, "day").endOf("day");
        break;
      case "this_week":
        start = dayjs().startOf("week");
        break;
      case "last_week":
        start = dayjs().subtract(1, "week").startOf("week");
        end = dayjs().subtract(1, "week").endOf("week");
        break;
      case "this_month":
        start = dayjs().startOf("month");
        break;
      case "last_month":
        start = dayjs().subtract(1, "month").startOf("month");
        end = dayjs().subtract(1, "month").endOf("month");
        break;
      case "custom":
        if (custom?.start && custom?.end) {
          start = dayjs(custom.start).startOf("day");
          end = dayjs(custom.end).endOf("day");
        }
        break;
      default:
        start = null;
        end = null;
    }

    onFilterChange({
      range,
      start: start ? start.toDate() : null,
      end: end ? end.toDate() : null,
    });
  };

  const handleCustomSubmit = () => {
    if (customRange.start && customRange.end) {
      setIsOpen(false);
      calculateAndSend("custom", customRange);
    }
  };

  const activeLabel = ranges.find((r) => r.value === selectedRange)?.label || "Filter by Date";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all text-sm font-medium"
      >
        <Calendar size={16} className="text-orange-500" />
        <span>{activeLabel}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl">
          <div className="p-2 space-y-1">
            {ranges.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRangeSelect(r.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedRange === r.value
                    ? "bg-orange-500 text-white font-semibold"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {selectedRange === "custom" && (
            <div className="p-3 border-t border-white/10 space-y-3 bg-black/40 text-xs">
              <div className="space-y-1">
                <label className="text-gray-500">From</label>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-md p-1.5 focus:border-orange-500 outline-none text-white invert"
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-500">To</label>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-md p-1.5 focus:border-orange-500 outline-none text-white invert"
                />
              </div>
              <button
                onClick={handleCustomSubmit}
                className="w-full bg-orange-500 text-white py-1.5 rounded-md font-bold hover:bg-orange-600 transition"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-[99]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DateRangeFilter;
