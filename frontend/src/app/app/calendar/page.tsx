"use client";

import React, { useState, useEffect } from "react";
import { Badge, Drawer, Tag, Spin, Button, Empty } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CalendarDays, Clock } from "lucide-react";
import { getAllModules } from "@/config/buildtrack.config";

interface ScheduledEvent {
  id: string;
  title: string;
  type: string;
  module: string;
  moduleSlug: string;
  recordId: string;
  startDate: Dayjs;
  endDate: Dayjs;
  fullData?: any;
}

const eventTypeColors: Record<string, string> = {
  meeting: "bg-blue-500",
  deadline: "bg-red-500",
  review: "bg-yellow-500",
  delivery: "bg-green-500",
  inspection: "bg-purple-500",
  billing: "bg-red-600",
  production: "bg-indigo-500",
  lead: "bg-orange-500",
  procurement: "bg-teal-500",
  quote: "bg-cyan-500",
  "site-visit": "bg-blue-600",
  "scheduled-start": "bg-gray-500",
  "scheduled-end": "bg-gray-600",
  "target-delivery": "bg-green-600",
  "actual-start": "bg-blue-400",
  "actual-end": "bg-green-400",
  "expected-resolution": "bg-yellow-600",
  "closure-date": "bg-green-700",
  "order-date": "bg-gray-400",
  "quote-date": "bg-cyan-600",
  "decision-date": "bg-yellow-700",
  "assigned-date": "bg-gray-300",
  default: "bg-gray-400",
};

const dateFieldKeywords = [
  "date", "due", "deadline", "delivery", "scheduled", "start", "end",
  "visit", "resolution", "closure", "created", "updated",
];

function isDateField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return dateFieldKeywords.some((keyword) => lower.includes(keyword));
}

function parseDate(value: any): dayjs.Dayjs | null {
  if (!value) return null;
  try {
    const parsed = dayjs(value);
    if (parsed.isValid()) return parsed;
  } catch {
    // Ignore
  }
  return null;
}

function inferEventType(fieldName: string): string {
  const lower = fieldName.toLowerCase();
  if (lower.includes("deadline") || lower.includes("due")) return "deadline";
  if (lower.includes("delivery")) return "delivery";
  if (lower.includes("inspection") || lower.includes("quality")) return "inspection";
  if (lower.includes("production") || lower.includes("manufacturing")) return "production";
  if (lower.includes("review") || lower.includes("approval")) return "review";
  if (lower.includes("billing") || lower.includes("invoice")) return "billing";
  if (lower.includes("procurement")) return "procurement";
  if (lower.includes("quote")) return "quote";
  if (lower.includes("visit")) return "site-visit";
  if (lower.includes("scheduled")) return "scheduled-start";
  if (lower.includes("start")) return "scheduled-start";
  if (lower.includes("end")) return "scheduled-end";
  if (lower.includes("resolution")) return "expected-resolution";
  if (lower.includes("closure")) return "closure-date";
  if (lower.includes("order")) return "order-date";
  return "default";
}

export default function CalendarPage() {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchAllModuleRecords = async () => {
      try {
        setLoading(true);
        const modules = getAllModules();
        const allEvents: ScheduledEvent[] = [];

        for (const module of modules) {
          try {
            const res = await fetch(
              `/backend-api/modules/${module.slug}/records`,
              { credentials: "include" }
            );

            if (!res.ok) continue;
            const data = await res.json();
            const records = data.records || [];

            for (const record of records) {
              const recordData = record.data || {};
              let startDate: Dayjs | null = null;
              let endDate: Dayjs | null = null;
              let eventFieldName = "";

              // Look for start/end date pairs or single date fields
              const dateFields = Object.entries(recordData).filter(
                ([key]) => isDateField(key)
              );

              // Find start date (prefer fields with "start" in name)
              const startField = dateFields.find(
                ([key]) =>
                  key.toLowerCase().includes("start") ||
                  key.toLowerCase().includes("begin")
              );
              if (startField) {
                startDate = parseDate(startField[1]);
                eventFieldName = startField[0];
              }

              // Find end date (prefer fields with "end" in name)
              const endField = dateFields.find(
                ([key]) =>
                  key.toLowerCase().includes("end") ||
                  key.toLowerCase().includes("due") ||
                  key.toLowerCase().includes("deadline") ||
                  key.toLowerCase().includes("delivery")
              );
              if (endField) {
                endDate = parseDate(endField[1]);
                if (!startDate) eventFieldName = endField[0];
              }

              // If only one date, use it for both start and end
              if (!startDate && !endDate && dateFields.length > 0) {
                const firstDate = parseDate(dateFields[0][1]);
                if (firstDate) {
                  startDate = firstDate;
                  endDate = firstDate;
                  eventFieldName = dateFields[0][0];
                }
              }

              if (startDate && endDate) {
                // Generate title
                let title = eventFieldName;
                const idField = Object.entries(recordData).find(
                  ([key]) => key.toLowerCase().includes("id") && key !== "_id"
                );
                const nameField = Object.entries(recordData).find(
                  ([key]) =>
                    key.toLowerCase().includes("name") ||
                    key.toLowerCase().includes("title")
                );

                if (idField && idField[1]) {
                  title = `${idField[1]} - ${eventFieldName}`;
                } else if (nameField && nameField[1]) {
                  title = `${nameField[1]} - ${eventFieldName}`;
                }

                allEvents.push({
                  id: `${record.id}-${eventFieldName}`,
                  title,
                  type: inferEventType(eventFieldName),
                  module: module.name,
                  moduleSlug: module.slug,
                  recordId: record.id,
                  startDate,
                  endDate,
                  fullData: recordData,
                });
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch ${module.slug} records:`, err);
          }
        }

        setEvents(allEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchAllModuleRecords();
  }, []);

  const getDaysInMonth = (date: Dayjs) => {
    return date.daysInMonth();
  };

  const getFirstDayOfMonth = (date: Dayjs) => {
    return date.startOf("month").day();
  };

  const getEventsForDay = (date: Dayjs): ScheduledEvent[] => {
    return events.filter(
      (event) =>
        date.isAfter(event.startDate.startOf("day"), "day") ||
        date.isSame(event.startDate.startOf("day"), "day")
    ).filter(
      (event) =>
        date.isBefore(event.endDate.startOf("day"), "day") ||
        date.isSame(event.endDate.startOf("day"), "day")
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const weeks = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(currentMonth.date(day));
    }

    // Group into weeks
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks.map((week, weekIdx) => (
      <div key={weekIdx} className="border-b">
        <div className="grid grid-cols-7 gap-0">
          {week.map((date, dayIdx) => (
            <div
              key={dayIdx}
              className="min-h-24 border-r p-2 bg-white hover:bg-gray-50 transition-colors"
            >
              {date ? (
                <div className="h-full">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {date.format("D")}
                  </div>
                  <div className="space-y-1">
                    {getEventsForDay(date).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => {
                          setSelectedEvent(event);
                          setDrawerOpen(true);
                        }}
                        className={`${eventTypeColors[event.type] || eventTypeColors.default} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Calendar</h1>
          <p className="text-gray-500 mt-1">
            View scheduled items across all modules.
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Spin size="small" />
            <span className="text-sm">Loading calendar data...</span>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spin />
          </div>
        ) : (
          <>
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentMonth.format("MMMM YYYY")}
              </h2>
              <div className="flex gap-2">
                <Button
                  type="text"
                  icon={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
                />
                <Button
                  type="text"
                  onClick={() => setCurrentMonth(dayjs())}
                >
                  Today
                </Button>
                <Button
                  type="text"
                  icon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
                />
              </div>
            </div>

            {/* Week Day Headers */}
            <div className="grid grid-cols-7 gap-0 bg-gray-50 border-b">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center font-semibold text-gray-700 border-r"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {renderCalendar()}

            {events.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Empty description="No scheduled items" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Event Details Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-orange-500" />
            <span>Event Details</span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={450}
      >
        {selectedEvent ? (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {selectedEvent.title}
              </h3>
              <Tag color={eventTypeColors[selectedEvent.type]?.replace("bg-", "") || "gray"}>
                {selectedEvent.type}
              </Tag>
            </div>

            {/* Module */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Module</p>
              <p className="text-gray-900">{selectedEvent.module}</p>
            </div>

            {/* Date Range */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Duration</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>
                    {selectedEvent.startDate.format("MMM DD, YYYY")}
                    {!selectedEvent.startDate.isSame(selectedEvent.endDate, "day") &&
                      ` - ${selectedEvent.endDate.format("MMM DD, YYYY")}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Full Event Data */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Event Information</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                {selectedEvent.fullData ? (
                  Object.entries(selectedEvent.fullData).map(([key, value]: [string, any]) => (
                    <div key={key} className="border-b border-gray-200 pb-2 last:border-0">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {key}
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value || "—")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No additional information</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Empty description="No event selected" />
        )}
      </Drawer>
    </div>
  );
}
