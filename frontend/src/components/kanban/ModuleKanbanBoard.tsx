"use client";

import React, { useMemo } from "react";
import KanbanBoardBase, { Card, Column } from "./KanbanBoardBase";
import { MODULE_KANBAN_CONFIGS, ModuleKanbanConfig } from "./moduleKanbanConfig";
import { Badge } from "@/components/ui/badge";
import { Card as UICard, CardContent } from "@/components/ui/card";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { getModuleBySlug } from "@/config/buildtrack.config";

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
    // Get the full status field name from module config
    // (because config fields include parentheses like "Design Status (Draft, ...)")
    const module = getModuleBySlug(moduleSlug);
    let fullStatusFieldName = config.statusFieldKey;
    if (module && config.statusFieldKey) {
      const statusKeySearch = config.statusFieldKey.split("(")[0].trim();
      const found = module.fields.find((f) => f.includes(statusKeySearch));
      if (found) {
        fullStatusFieldName = found;
        console.log(`[${moduleSlug}] Using full status field name: ${fullStatusFieldName}`);
      }
    }

    // Validate card title field exists
    if (module && config.cardTitleFieldKey) {
      const titleFieldExists = module.fields.some((f) =>
        f.includes(config.cardTitleFieldKey.split("(")[0].trim())
      );
      if (!titleFieldExists) {
        console.warn(
          `[${moduleSlug}] WARNING: cardTitleFieldKey "${config.cardTitleFieldKey}" not found in module fields!`,
          `Available fields:`, module.fields
        );
      }
    }

    return records.map((record) => {
      const id = (record._id || record.id) as string;
      const title = String(record[config.cardTitleFieldKey] || id);
      const status = String(record[fullStatusFieldName] || config.columns[0].key);

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
    console.log("[ModuleKanbanBoard] handleCardMove called - cardId:", cardId, "newStatus:", newStatus);
    console.log("[ModuleKanbanBoard] onStatusChange callback exists:", !!onStatusChange);
    if (onStatusChange) {
      console.log("[ModuleKanbanBoard] Calling onStatusChange");
      return onStatusChange(cardId, newStatus);
    } else {
      console.log("[ModuleKanbanBoard] No onStatusChange callback!");
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
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
          console.log("[ModuleKanbanBoard] onDragStart - hasWriteAccess:", hasWriteAccess, "card.id:", card.id);
          if (!hasWriteAccess) {
            console.log("[ModuleKanbanBoard] Preventing drag - no write access");
            e.preventDefault();
          } else {
            // Set the card ID in dataTransfer for the drop handler
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("cardId", card.id);
            console.log("[ModuleKanbanBoard] Drag started - cardId set to:", card.id);
          }
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
