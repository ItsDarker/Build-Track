"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Badge, Drawer, Tag, Spin } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";
import { getAllModules } from "@/config/buildtrack.config";

interface ScheduledItem {
  title: string;
  type: string;
  module: string;
  time?: string;
  recordId: string;
  moduleSlug: string;
}

const typeBadgeColor: Record<string, "success" | "processing" | "error" | "warning" | "default"> = {
  meeting: "processing",
  deadline: "error",
  review: "warning",
  delivery: "success",
  inspection: "processing",
  billing: "error",
  production: "default",
  lead: "warning",
  procurement: "success",
  quote: "processing",
  "site-visit": "processing",
  "scheduled-start": "default",
  "scheduled-end": "warning",
  "target-delivery": "success",
  "actual-start": "processing",
  "actual-end": "success",
  "expected-resolution": "warning",
  "closure-date": "success",
  "order-date": "default",
  "quote-date": "processing",
  "decision-date": "warning",
  "assigned-date": "default",
};

// Date field keywords to detect date fields in modules
const dateFieldKeywords = [
  "date",
  "due",
  "deadline",
  "delivery",
  "scheduled",
  "start",
  "end",
  "visit",
  "resolution",
  "closure",
  "created",
  "updated",
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
    // Ignore parsing errors
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
  const [scheduledItems, setScheduledItems] = useState<Record<string, ScheduledItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchAllModuleRecords = async () => {
      try {
        setLoading(true);
        const modules = getAllModules();
        const items: Record<string, ScheduledItem[]> = {};

        // Fetch records from each module
        for (const module of modules) {
          try {
            const res = await fetch(
              `/backend-api/modules/${module.slug}/records`,
              { credentials: "include" }
            );

            if (!res.ok) continue;

            const data = await res.json();
            const records = data.records || [];

            // Extract date fields from each record
            for (const record of records) {
              const recordData = record.data || {};

              // Look for date fields
              for (const [fieldName, fieldValue] of Object.entries(recordData)) {
                if (!isDateField(fieldName)) continue;

                const parsedDate = parseDate(fieldValue);
                if (!parsedDate) continue;

                const dateKey = parsedDate.format("YYYY-MM-DD");
                if (!items[dateKey]) items[dateKey] = [];

                // Generate title from record data (look for ID or name fields)
                let title = `${fieldName}`;
                const idField = Object.entries(recordData).find(
                  ([key]) => key.toLowerCase().includes("id") && key !== "_id"
                );
                const nameField = Object.entries(recordData).find(
                  ([key]) => key.toLowerCase().includes("name") || key.toLowerCase().includes("title")
                );

                if (idField && idField[1]) {
                  title = `${idField[1]} - ${fieldName}`;
                } else if (nameField && nameField[1]) {
                  title = `${nameField[1]} - ${fieldName}`;
                }

                items[dateKey].push({
                  title,
                  type: inferEventType(fieldName),
                  module: module.name,
                  recordId: record.id,
                  moduleSlug: module.slug,
                });
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch ${module.slug} records:`, err);
            // Continue with next module
          }
        }

        setScheduledItems(items);
      } finally {
        setLoading(false);
      }
    };

    fetchAllModuleRecords();
  }, []);

  const getItems = (date: Dayjs): ScheduledItem[] => {
    const key = date.format("YYYY-MM-DD");
    return scheduledItems[key] || [];
  };

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    const items = getItems(date);
    if (items.length > 0) {
      setDrawerOpen(true);
    }
  };

  const selectedItems = selectedDate ? getItems(selectedDate) : [];

  // Cell renderer for the calendar — shows badges for scheduled items
  const cellRender = (current: Dayjs, info: { type: string }) => {
    if (info.type !== "date") return null;
    const items = getItems(current);
    if (items.length === 0) return null;

    return (
      <ul className="list-none p-0 m-0">
        {items.slice(0, 3).map((item, idx) => (
          <li key={idx} className="mb-0.5">
            <Badge
              status={typeBadgeColor[item.type] || "default"}
              text={
                <span className="text-xs truncate block max-w-[120px]">
                  {item.title}
                </span>
              }
            />
          </li>
        ))}
        {items.length > 3 && (
          <li className="text-xs text-gray-400">+{items.length - 3} more</li>
        )}
      </ul>
    );
  };

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

      {/* Calendar grid using AntD Calendar */}
      <div className="bg-white rounded-lg border p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spin />
          </div>
        ) : (
          <Calendar
            cellRender={cellRender}
            onSelect={handleDateSelect}
          />
        )}
      </div>

      {/* Scheduled items drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-orange-500" />
            <span>
              Scheduled Items —{" "}
              {selectedDate?.format("MMMM D, YYYY")}
            </span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
      >
        {selectedItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No items scheduled for this date.
          </p>
        ) : (
          <div className="space-y-4">
            {selectedItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <Tag className="mt-1">{item.module}</Tag>
                  </div>
                  <Badge
                    status={typeBadgeColor[item.type] || "default"}
                    text={item.type}
                  />
                </div>
                {item.time && (
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {item.time}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
