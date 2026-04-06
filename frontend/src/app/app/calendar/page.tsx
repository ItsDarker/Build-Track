"use client";

import React, { useState, useEffect } from "react";
import { Modal, Spin, Empty, Tag, Card, Button } from "antd";
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
  "project-requirements": "#1890ff",
  "work-orders": "#722ed1",
  "delivery-installation": "#52c41a",
  "quality-control": "#eb2f96",
  "production-scheduling": "#fa8c16",
  "bom-materials-planning": "#13c2c2",
  default: "#8c8c8c",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

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

              if (dateEntries.length === 0) continue;

              let startDate = null;
              let endDate = null;

              for (const [key, value] of dateEntries) {
                const lower = key.toLowerCase();
                if ((lower.includes("start") || lower.includes("scheduled")) && !startDate) {
                  startDate = dayjs(value as any);
                }
                if ((lower.includes("end") || lower.includes("delivery") || lower.includes("due")) && !endDate) {
                  endDate = dayjs(value as any);
                }
              }

              if (!startDate && !endDate) {
                startDate = endDate = dayjs(dateEntries[0]?.[1] as any);
              } else if (startDate && !endDate) {
                endDate = startDate;
              } else if (endDate && !startDate) {
                startDate = endDate;
              }

              if (startDate && startDate.isValid() && endDate && endDate.isValid()) {
                const title =
                  (recordData["Project Name"] ||
                    recordData["Task Description"] ||
                    recordData["Delivery ID"] ||
                    recordData["Requirement Record ID"] ||
                    moduleName) +
                  (recordData["Work Order ID"] ? ` - ${recordData["Work Order ID"]}` : "");

                allEvents.push({
                  id: record.id,
                  title: title.trim(),
                  module: moduleName,
                  startDate,
                  endDate,
                  fullData: recordData,
                });
              }
            }
          } catch (err) {
            console.log(`Module ${moduleName} skipped:`, err);
          }
        }

        setEvents(allEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const monthStart = currentDate.startOf("month");
  const monthEnd = currentDate.endOf("month");
  const calendarStart = monthStart.startOf("week");
  const calendarEnd = monthEnd.endOf("week");

  const days: Dayjs[] = [];
  let current = calendarStart;
  while (current.isSame(calendarEnd, "day") || current.isBefore(calendarEnd, "day")) {
    days.push(current);
    current = current.add(1, "day");
  }

  const weeks = Array.from({ length: Math.ceil(days.length / 7) }).map((_, i) =>
    days.slice(i * 7, (i + 1) * 7)
  );

  const monthEvents = events.filter(
    (e) => !e.endDate.isBefore(calendarStart, "day") && !e.startDate.isAfter(calendarEnd, "day")
  );

  const getWeekEventBars = (weekDays: Dayjs[]) => {
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];

    const bars: Array<{
      event: CalendarEvent;
      startCol: number;
      endCol: number;
      width: number;
      row: number;
    }> = [];

    const eventsByRow: Array<CalendarEvent[]> = [];

    for (const event of monthEvents.filter(
      (e) => !e.endDate.isBefore(weekStart, "day") && !e.startDate.isAfter(weekEnd, "day")
    )) {
      const eventStart = event.startDate.isBefore(weekStart, "day") ? 0 : event.startDate.diff(weekStart, "day");
      const eventEnd = event.endDate.isAfter(weekEnd, "day") ? 6 : event.endDate.diff(weekStart, "day");
      const width = eventEnd - eventStart + 1;

      let row = 0;
      let placed = false;
      while (!placed) {
        if (!eventsByRow[row]) {
          eventsByRow[row] = [];
        }

        const overlaps = eventsByRow[row].some((e) => {
          const eStart = e.startDate.isBefore(weekStart, "day") ? 0 : e.startDate.diff(weekStart, "day");
          const eEnd = e.endDate.isAfter(weekEnd, "day") ? 6 : e.endDate.diff(weekStart, "day");
          return !(eventEnd < eStart || eventStart > eEnd);
        });

        if (!overlaps) {
          eventsByRow[row].push(event);
          bars.push({ event, startCol: eventStart, endCol: eventEnd, width, row });
          placed = true;
        } else {
          row++;
        }
      }
    }

    return { bars, numRows: eventsByRow.length };
  };

  return (
    <div className="w-full bg-white p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-2">View all your project events and deadlines</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Spin size="large" tip="Loading events..." />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <Empty description="No events found" />
        </Card>
      ) : null}

      <Card className="shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200 mb-6">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setCurrentDate(currentDate.subtract(1, "month"))}
            />
            <div className="flex gap-2 min-w-[200px]">
              <select
                value={currentDate.month()}
                onChange={(e) => setCurrentDate(currentDate.clone().month(parseInt(e.target.value)))}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{dayjs().month(i).format("MMMM")}</option>
                ))}
              </select>
              <select
                value={currentDate.year()}
                onChange={(e) => setCurrentDate(currentDate.clone().year(parseInt(e.target.value)))}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                {Array.from({ length: 30 }).map((_, i) => {
                  const year = dayjs().year() - 10 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <Button
              type="text"
              icon={<ArrowRightOutlined />}
              onClick={() => setCurrentDate(currentDate.add(1, "month"))}
            />
          </div>
          <Button type="primary" onClick={() => setCurrentDate(dayjs())}>Today</Button>
        </div>

        {/* Calendar */}
        <div className="max-w-7xl mx-auto overflow-x-auto">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-gray-300 bg-gray-50">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="p-2 text-center font-semibold text-gray-700 border-r border-gray-300 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((weekDays, weekIdx) => {
            const { bars, numRows } = getWeekEventBars(weekDays);

            return (
              <div key={weekIdx}>
                {/* Event bars row */}
                {numRows > 0 && (
                  <div className="grid grid-cols-7 gap-0 border-b border-gray-300 relative bg-gray-50 px-1" style={{ minHeight: `${numRows * 24 + 8}px` }}>
                    {bars.map((bar) => (
                      <div
                        key={bar.event.id}
                        onClick={() => {
                          setSelectedEvent(bar.event);
                          setModalOpen(true);
                        }}
                        className="absolute h-5 rounded px-1 text-white text-xs font-semibold cursor-pointer hover:shadow-md transition overflow-hidden"
                        style={{
                          left: `${(bar.startCol / 7) * 100 + 0.4}%`,
                          width: `${(bar.width / 7) * 100 - 0.8}%`,
                          top: `${8 + bar.row * 24}px`,
                          backgroundColor: MODULE_COLORS[bar.event.module] || MODULE_COLORS.default,
                        }}
                        title={bar.event.title}
                      >
                        <span className="block truncate">{bar.event.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-0 border-b border-gray-300">
                  {weekDays.map((day) => {
                    const isCurrentMonth = day.month() === currentDate.month();
                    return (
                      <div
                        key={day.format("YYYY-MM-DD")}
                        className={`border-r border-gray-300 p-2 min-h-24 text-right text-sm font-semibold ${
                          isCurrentMonth ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        {day.date()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal */}
      <Modal title="Event Details" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={600}>
        {selectedEvent ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedEvent.title}</h3>
              <Tag color={MODULE_COLORS[selectedEvent.module] || MODULE_COLORS.default} style={{ color: "#fff" }}>
                {selectedEvent.module}
              </Tag>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Duration</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-gray-600">Start Date</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedEvent.startDate.format("MMM DD, YYYY")}</p>
                </div>
                <div className="text-gray-400">→</div>
                <div>
                  <p className="text-xs text-gray-600">End Date</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedEvent.endDate.format("MMM DD, YYYY")}</p>
                </div>
              </div>
              {!selectedEvent.startDate.isSame(selectedEvent.endDate, "day") && (
                <p className="text-sm text-gray-600 mt-3">
                  Duration: {selectedEvent.endDate.diff(selectedEvent.startDate, "day")} days
                </p>
              )}
            </div>

            {selectedEvent.fullData && Object.keys(selectedEvent.fullData).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Details</h4>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {Object.entries(selectedEvent.fullData)
                    .filter(([key]) => !key.startsWith("_"))
                    .map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">{key}</p>
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
