"use client";

import React, { useState } from "react";
import { Calendar, Badge, Drawer, Tag } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";

// Mock scheduled items — TODO: replace with backend API data
const mockScheduledItems: Record<
  string,
  Array<{ title: string; type: string; module: string; time?: string }>
> = {
  // Current month items
  [dayjs().format("YYYY-MM-DD")]: [
    { title: "Client consultation - Acme Corp", type: "meeting", module: "Project Requirements", time: "10:00 AM" },
    { title: "WO-1001 Due: Kitchen cabinets", type: "deadline", module: "Work Orders", time: "5:00 PM" },
  ],
  [dayjs().add(1, "day").format("YYYY-MM-DD")]: [
    { title: "Design review - Modern Office", type: "review", module: "Design Configurator", time: "2:00 PM" },
  ],
  [dayjs().add(3, "day").format("YYYY-MM-DD")]: [
    { title: "Delivery: Home Pro Ltd bathroom set", type: "delivery", module: "Delivery & Installation", time: "9:00 AM" },
    { title: "QC Inspection - Order #2045", type: "inspection", module: "Quality Control", time: "11:00 AM" },
    { title: "Invoice due - BuildRight Inc", type: "billing", module: "Billing & Invoicing" },
  ],
  [dayjs().add(5, "day").format("YYYY-MM-DD")]: [
    { title: "Production start: Custom shelving", type: "production", module: "Manufacturing", time: "8:00 AM" },
  ],
  [dayjs().add(7, "day").format("YYYY-MM-DD")]: [
    { title: "Follow up lead: Urban Design Co", type: "lead", module: "CRM / Leads", time: "3:00 PM" },
    { title: "Material delivery from supplier", type: "procurement", module: "Procurement", time: "10:00 AM" },
  ],
  [dayjs().add(10, "day").format("YYYY-MM-DD")]: [
    { title: "Packaging job: Order #3022", type: "production", module: "Packaging" },
    { title: "Final inspection before delivery", type: "inspection", module: "Quality Control", time: "1:00 PM" },
  ],
  [dayjs().add(14, "day").format("YYYY-MM-DD")]: [
    { title: "Project closure meeting", type: "meeting", module: "Closure", time: "4:00 PM" },
  ],
  [dayjs().subtract(2, "day").format("YYYY-MM-DD")]: [
    { title: "Quote sent: GreenBuild LLC", type: "quote", module: "Quoting & Contracts" },
  ],
  [dayjs().subtract(5, "day").format("YYYY-MM-DD")]: [
    { title: "Approval pending - Design v3", type: "review", module: "Approval Workflow" },
  ],
};

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
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getItems = (date: Dayjs) => {
    const key = date.format("YYYY-MM-DD");
    return mockScheduledItems[key] || [];
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
      </div>

      {/* Calendar grid using AntD Calendar */}
      <div className="bg-white rounded-lg border p-4">
        <Calendar
          cellRender={cellRender}
          onSelect={handleDateSelect}
        />
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
