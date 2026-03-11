"use client";

import React, { useMemo } from "react";
import KanbanBoardBase, { Card, Column } from "./KanbanBoardBase";
import { MODULE_KANBAN_CONFIGS, ModuleKanbanConfig } from "./moduleKanbanConfig";
import { Badge } from "@/components/ui/badge";
import { Card as UICard, CardContent } from "@/components/ui/card";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Button } from "antd";

interface ModuleKanbanBoardProps {
  moduleSlug: string;
  records: Record<string, unknown>[];
  onCardClick: (record: Record<string, unknown>) => void;
  onCardEdit?: (record: Record<string, unknown>) => void;
  onCardDelete?: (recordId: string) => void;
  onStatusChange?: (recordId: string, newStatus: string) => void;
  isLoading?: boolean;
  hasWriteAccess?: boolean;
}

/**
 * Adapter component that maps module records to Kanban cards
 * Handles record-to-card transformation and status update callbacks
 */
export const ModuleKanbanBoard: React.FC<ModuleKanbanBoardProps> = ({
  moduleSlug,
  records,
  onCardClick,
  onCardEdit,
  onCardDelete,
  onStatusChange,
  isLoading = false,
  hasWriteAccess = true,
}) => {
  const config = MODULE_KANBAN_CONFIGS[moduleSlug];

  if (!config) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Kanban view not available for this module
      </div>
    );
  }

  // Convert records to Kanban cards
  const cards = useMemo(() => {
    return records.map((record) => {
      const id = (record._id || record.id) as string;
      const title = String(record[config.cardTitleFieldKey] || id);
      const status = String(record[config.statusFieldKey] || config.columns[0].key);

      // Collect metadata fields (non-empty values from specified keys)
      const tags: string[] = [];
      config.cardMetaFieldKeys.forEach((key) => {
        const value = getNestedValue(record, key);
        if (value) {
          tags.push(String(value));
        }
      });

      // Store creator info in card data
      const createdBy = String(record["Created by"] || "Unknown");
      const createdAt = String(record["Created at"] || "");

      return {
        id,
        title,
        status,
        tags,
        description: undefined,
        createdBy,
        createdAt,
      } as Card & { createdBy: string; createdAt: string };
    });
  }, [records, config]);

  const handleCardMove = (cardId: string, newStatus: string): Promise<boolean> | void => {
    if (onStatusChange) {
      return onStatusChange(cardId, newStatus);
    }
  };

  const handleCardClick = (card: Card) => {
    const record = records.find((r) => (r._id || r.id) === card.id);
    if (record) {
      onCardClick(record);
    }
  };

  // Custom card renderer with creator info and action buttons
  const renderCard = (card: any) => {
    // Get initials from creator name
    const creatorInitials = card.createdBy
      ? card.createdBy.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
      : "?";

    const record = records.find((r) => (r._id || r.id) === card.id);

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onCardEdit && record) {
        onCardEdit(record);
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onCardDelete) {
        onCardDelete(card.id);
      }
    };

    return (
      <div
        key={card.id}
        draggable
        onDragStart={(e) => {
          if (!hasWriteAccess) e.preventDefault();
        }}
        className={`group ${!hasWriteAccess ? "cursor-pointer" : "cursor-grab"} active:cursor-grabbing`}
      >
        <UICard className="h-full hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <h4 className="font-semibold text-sm line-clamp-3 mb-2 text-foreground">
              {card.title}
            </h4>
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {card.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {/* Creator info at bottom of card */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {creatorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 truncate">{card.createdBy}</p>
                {card.createdAt && (
                  <p className="text-xs text-gray-400">
                    {new Date(card.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons - visible on hover */}
            <div className="flex gap-1 mt-3 pt-3 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleCardClick(card)}
                className="flex-1"
                title="View"
              />
              {hasWriteAccess && (
                <>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                    className="flex-1"
                    title="Edit"
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                    className="flex-1"
                    title="Delete"
                  />
                </>
              )}
            </div>
          </CardContent>
        </UICard>
      </div>
    );
  };

  return (
    <KanbanBoardBase
      columns={config.columns as Column[]}
      initialCards={cards}
      onCardMove={handleCardMove}
      onCardClick={handleCardClick}
      renderCard={(card) => renderCard(card)}
      isLoading={isLoading}
      emptyColumnMessage="No records"
      readOnly={!hasWriteAccess}
    />
  );
};

/**
 * Helper function to get nested object values (e.g., "projectManager.name")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, part) => current?.[part], obj);
}

export default ModuleKanbanBoard;
