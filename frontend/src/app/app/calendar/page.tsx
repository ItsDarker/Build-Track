"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Badge, Modal, Spin, Empty, Tag, Card, Space, Button } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";

interface CalendarEvent {
  id: string;
  title: string;
  module: string;
  startDate: Dayjs;
  endDate: Dayjs;
  fullData?: any;
}

const MODULE_COLORS: Record<string, string> = {
  "project-requirements": "blue",
  "work-orders": "purple",
  "delivery-installation": "green",
  "quality-control": "magenta",
  "production-scheduling": "orange",
  "bom-materials-planning": "cyan",
  default: "gray",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const modules = [
          "project-requirements",
          "work-orders",
          "delivery-installation",
          "quality-control",
          "production-scheduling",
          "bom-materials-planning",
        ];

        const allEvents: CalendarEvent[] = [];

        for (const moduleName of modules) {
          try {
            const res = await fetch(`/backend-api/modules/${moduleName}/records`, {
              credentials: "include",
            });

            if (!res.ok) continue;

            const data = await res.json();
            const records = Array.isArray(data.records) ? data.records : [];

            for (const record of records) {
              const recordData = record.data || {};

              console.log(`Processing record: ${moduleName}`, recordData);

              // Find date fields
              const dateEntries = Object.entries(recordData).filter(([key]) => {
                const lower = key.toLowerCase();
                return (
                  lower.includes("date") ||
                  lower.includes("start") ||
                  lower.includes("end") ||
                  lower.includes("scheduled") ||
                  lower.includes("delivery")
                );
              });

              console.log(`Found ${dateEntries.length} date fields:`, dateEntries.map(([k]) => k));
              if (dateEntries.length === 0) continue;

              // Get start and end dates
              let startDate = null;
              let endDate = null;

              for (const [key, value] of dateEntries) {
                const lower = key.toLowerCase();
                if ((lower.includes("start") || lower.includes("scheduled") || lower.includes("begin")) && !startDate) {
                  startDate = dayjs(value as any);
                }
                if ((lower.includes("end") || lower.includes("delivery") || lower.includes("due") || lower.includes("expected")) && !endDate) {
                  endDate = dayjs(value as any);
                }
              }

              // If only one date, use for both
              if (!startDate && !endDate) {
                startDate = endDate = dayjs(dateEntries[0]?.[1] as any);
              } else if (startDate && !endDate) {
                endDate = startDate;
              } else if (endDate && !startDate) {
                startDate = endDate;
              }

              console.log(`startDate: ${startDate?.format()}, endDate: ${endDate?.format()}`);

              if (startDate && startDate.isValid() && endDate && endDate.isValid()) {
                const title =
                  (recordData["Project Name"] ||
                    recordData["Task Description"] ||
                    recordData["Delivery ID"] ||
                    recordData["Requirement Record ID"] ||
                    moduleName) +
                  (recordData["Work Order ID"] ? ` - ${recordData["Work Order ID"]}` : "");

                console.log(`✓ Adding event: ${title}`);

                allEvents.push({
                  id: record.id,
                  title: title.trim(),
                  module: moduleName,
                  startDate,
                  endDate,
                  fullData: recordData,
                });
              } else {
                console.log(`✗ Skipping record - invalid dates`);
              }
            }
          } catch (err) {
            console.log(`Module ${moduleName} skipped:`, err);
          }
        }

        console.log(`✓ Total events found: ${allEvents.length}`);
        setEvents(allEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    return events.filter(
      (event) =>
        (date.isSame(event.startDate, "day") ||
          date.isAfter(event.startDate, "day")) &&
        (date.isSame(event.endDate, "day") ||
          date.isBefore(event.endDate, "day"))
    );
  };

  // Render cell with events
  const dateCellRender = (date: Dayjs) => {
    const dayEvents = getEventsForDate(date);
    return (
      <div className="space-y-1">
        {dayEvents.slice(0, 3).map((event) => (
          <div
            key={event.id}
            onClick={() => {
              setSelectedEvent(event);
              setModalOpen(true);
            }}
            className="cursor-pointer"
          >
            <Badge
              color={MODULE_COLORS[event.module] || MODULE_COLORS.default}
              text={
                <span className="text-xs truncate text-gray-700 hover:text-gray-900">
                  {event.title.substring(0, 20)}...
                </span>
              }
            />
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div className="text-xs text-gray-500 px-2">+{dayEvents.length - 3} more</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-2">View all your project events and deadlines</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Spin size="large" tip="Loading events..." />
        </div>
      ) : events.length === 0 ? (
        <Card className="mb-6">
          <Empty description="No events found" />
        </Card>
      ) : null}

      <Card className="shadow-sm border border-gray-200">
        <Calendar
          fullscreen
          value={currentDate}
          onChange={setCurrentDate}
          dateCellRender={dateCellRender}
          headerRender={({ value, onChange }: any) => {
            const start = 0;
            const end = 12;
            const monthOptions = [];

            const getYear = value.year();
            const currentYear = new Date().getFullYear();
            const start_year = currentYear - 10;
            const end_year = start_year + 20;

            const yearOptions = [];
            for (let i = start_year; i < end_year; i++) {
              yearOptions.push({
                label: i.toString(),
                value: i,
              });
            }

            for (let i = start; i < end; i++) {
              monthOptions.push({
                label: dayjs().month(i).format("MMM"),
                value: i,
              });
            }

            const month = value.month();

            return (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      onChange(value.subtract(1, "month"));
                    }}
                  />
                  <div className="flex gap-2">
                    <select
                      value={month}
                      onChange={(e) => {
                        const newMonth = parseInt(e.target.value);
                        onChange(value.clone().month(newMonth));
                      }}
                      className="px-3 py-1 border border-gray-300 rounded hover:border-gray-400 focus:outline-none"
                    >
                      {monthOptions.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={getYear}
                      onChange={(e) => {
                        const newYear = parseInt(e.target.value);
                        onChange(value.clone().year(newYear));
                      }}
                      className="px-3 py-1 border border-gray-300 rounded hover:border-gray-400 focus:outline-none"
                    >
                      {yearOptions.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="text"
                    icon={<ArrowRightOutlined />}
                    onClick={() => {
                      onChange(value.add(1, "month"));
                    }}
                  />
                </div>
                <Button
                  type="primary"
                  onClick={() => {
                    onChange(dayjs());
                  }}
                >
                  Today
                </Button>
              </div>
            );
          }}
          style={{
            minHeight: "600px",
          }}
        />
      </Card>

      {/* Event Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">Event Details</span>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedEvent ? (
          <div className="space-y-6">
            {/* Event Title */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {selectedEvent.title}
              </h3>
              <Tag color={MODULE_COLORS[selectedEvent.module] || MODULE_COLORS.default}>
                {selectedEvent.module}
              </Tag>
            </div>

            {/* Date Range */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Duration</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-gray-600">Start Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedEvent.startDate.format("MMM DD, YYYY")}
                  </p>
                </div>
                <div className="text-gray-400">→</div>
                <div>
                  <p className="text-xs text-gray-600">End Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedEvent.endDate.format("MMM DD, YYYY")}
                  </p>
                </div>
              </div>
              {!selectedEvent.startDate.isSame(selectedEvent.endDate, "day") && (
                <p className="text-sm text-gray-600 mt-3">
                  Duration: {selectedEvent.endDate.diff(selectedEvent.startDate, "day")} days
                </p>
              )}
            </div>

            {/* Event Data */}
            {selectedEvent.fullData && Object.keys(selectedEvent.fullData).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Details</h4>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {Object.entries(selectedEvent.fullData)
                    .filter(([key]) => !key.startsWith("_"))
                    .map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                          {key}
                        </p>
                        <p className="text-sm text-gray-900">
                          {typeof value === "string" && value.includes("T")
                            ? dayjs(value).format("MMM DD, YYYY")
                            : typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value || "—")}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Empty description="No event selected" />
        )}
      </Modal>
    </div>
  );
}
