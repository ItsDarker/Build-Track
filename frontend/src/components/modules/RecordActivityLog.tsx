import React from "react";
import { Timeline, Empty } from "antd";
import { UserOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

interface ActivityEvent {
  type: "created" | "updated" | "other";
  user: string;
  date: string;
  description: string;
  icon?: React.ReactNode;
}

interface RecordActivityLogProps {
  record: Record<string, any>;
}

/**
 * Displays the audit trail and activity history for a record
 * Shows creation, updates, and other significant events
 * This component is ready to display activity history from the database
 */
export const RecordActivityLog: React.FC<RecordActivityLogProps> = ({ record }) => {
  if (!record) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
          <UserOutlined className="text-blue-600" />
          Record Owner & History
        </h3>
        <Empty description="No record data available" />
      </div>
    );
  }

  const events: ActivityEvent[] = [];

  // Created event (Primary owner information)
  if (record["Created by"] || record["Created at"]) {
    const createdDate = record["Created at"] ? new Date(record["Created at"]) : null;
    const formattedDate = createdDate
      ? createdDate.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown date";

    const creatorName = record["Created by"] || "Unknown";

    events.push({
      type: "created",
      user: creatorName,
      date: formattedDate,
      description: `Created by ${creatorName}`,
      icon: <PlusOutlined />,
    });
  }

  // Updated event (only if different from created)
  if (record["Updated by"] && record["Update at"]) {
    const updatedDate = record["Update at"] ? new Date(record["Update at"]) : null;
    const createdDate = record["Created at"] ? new Date(record["Created at"]) : null;

    // Only show if the update is after creation or no creation date
    if (!createdDate || (updatedDate && updatedDate.getTime() !== createdDate.getTime())) {
      const formattedDate = updatedDate
        ? updatedDate.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Unknown date";

      events.push({
        type: "updated",
        user: record["Updated by"],
        date: formattedDate,
        description: `Updated by ${record["Updated by"]}`,
        icon: <EditOutlined />,
      });
    }
  }

  // If no events, show a placeholder
  if (events.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
          <UserOutlined className="text-blue-600" />
          Record Owner & History
        </h3>
        <Empty description="No activity recorded" />
      </div>
    );
  }

  // Show primary owner info at the top, then history
  const primaryOwner = events[0]; // Created by is the owner

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
        <UserOutlined className="text-blue-600" />
        Record Owner & History
      </h3>

      {/* Primary Owner Information */}
      <div className="bg-white rounded border border-gray-200 p-3 mb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {primaryOwner.user
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900">Owner: {primaryOwner.user}</p>
          <p className="text-xs text-gray-500 mt-0.5">Created on {primaryOwner.date}</p>
        </div>
      </div>

      {/* Activity History Timeline */}
      {events.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-3 uppercase">Activity History</p>
          <Timeline
            items={events.map((event) => ({
              dot: event.icon,
              children: (
                <div className="pb-2">
                  <p className="text-xs text-gray-900">
                    <span className="font-medium">{event.user}</span> {event.type === "created" ? "created" : "updated"} this record
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{event.date}</p>
                </div>
              ),
            }))}
          />
        </div>
      )}

      {/* Note about activity tracking */}
      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-800">
          💡 <strong>Full activity history</strong> (field-level changes, edits) is available when connected to activity logging backend.
        </p>
      </div>
    </div>
  );
};

export default RecordActivityLog;
