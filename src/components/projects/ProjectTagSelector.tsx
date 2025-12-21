"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tag, ChevronDown, Search, Settings, Plus, Check, X } from "lucide-react";
import {
  getProjectTags,
  createProjectTag,
  updateProjectTag,
  deleteProjectTag,
  assignTagToProject,
} from "@/app/actions/projectTags";

interface ProjectTag {
  id: string;
  name: string;
  color: string;
}

interface ProjectTagSelectorProps {
  projectId: string;
  currentTag?: ProjectTag | null;
  onTagChange?: (tag: ProjectTag | null) => void;
  isPartner?: boolean;
  readOnly?: boolean;
}

const DEFAULT_COLORS = [
  "#9333EA", // Purple
  "#16A34A", // Green
  "#6366F1", // Indigo
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#6B7280", // Gray
];

export function ProjectTagSelector({
  projectId,
  currentTag,
  onTagChange,
  isPartner = false,
  readOnly = false,
}: ProjectTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isManaging, setIsManaging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);
  const [editingTag, setEditingTag] = useState<ProjectTag | null>(null);
  const [selectedTag, setSelectedTag] = useState<ProjectTag | null>(currentTag || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    setSelectedTag(currentTag || null);
  }, [currentTag]);

  const loadTags = async () => {
    const result = await getProjectTags();
    if (result.success) {
      setTags(result.tags);
    }
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTag = async (tag: ProjectTag | null) => {
    if (readOnly) return;
    
    setIsLoading(true);
    const result = await assignTagToProject(projectId, tag?.id || null);
    setIsLoading(false);

    if (result.success) {
      setSelectedTag(tag);
      onTagChange?.(tag);
      setOpen(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsLoading(true);
    const result = await createProjectTag({
      name: newTagName.trim(),
      color: newTagColor,
    });
    setIsLoading(false);

    if (result.success && result.tag) {
      setTags([...tags, result.tag]);
      setNewTagName("");
      setNewTagColor(DEFAULT_COLORS[0]);
      setIsCreating(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editingTag.name.trim()) return;

    setIsLoading(true);
    const result = await updateProjectTag(editingTag.id, {
      name: editingTag.name,
      color: editingTag.color,
    });
    setIsLoading(false);

    if (result.success && result.tag) {
      setTags(tags.map((t) => (t.id === editingTag.id ? result.tag : t)));
      if (selectedTag?.id === editingTag.id) {
        setSelectedTag(result.tag);
        onTagChange?.(result.tag);
      }
      setEditingTag(null);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    setIsLoading(true);
    const result = await deleteProjectTag(tagId);
    setIsLoading(false);

    if (result.success) {
      setTags(tags.filter((t) => t.id !== tagId));
      if (selectedTag?.id === tagId) {
        setSelectedTag(null);
        onTagChange?.(null);
      }
    }
  };

  if (readOnly) {
    return selectedTag ? (
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: selectedTag.color }}
        />
        <span className="text-sm">{selectedTag.name}</span>
      </div>
    ) : (
      <span className="text-sm text-gray-400">No tag</span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-dashed"
          disabled={isLoading}
        >
          {selectedTag ? (
            <>
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: selectedTag.color }}
              />
              <span>{selectedTag.name}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Tags</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        {isManaging ? (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Manage Tags</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setIsManaging(false);
                  setIsCreating(false);
                  setEditingTag(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isCreating ? (
              <div className="space-y-3">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-8"
                />
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-md border-2 ${
                        newTagColor === color
                          ? "border-gray-900"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || isLoading}
                  >
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setIsCreating(false);
                      setNewTagName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : editingTag ? (
              <div className="space-y-3">
                <Input
                  placeholder="Tag name"
                  value={editingTag.name}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, name: e.target.value })
                  }
                  className="h-8"
                />
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-md border-2 ${
                        editingTag.color === color
                          ? "border-gray-900"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setEditingTag({ ...editingTag, color })
                      }
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8"
                    onClick={handleUpdateTag}
                    disabled={!editingTag.name.trim() || isLoading}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setEditingTag(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-sm"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setEditingTag(tag)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 mt-2"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create New Tag
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {isPartner && (
              <div
                className="flex items-center gap-2 px-3 py-2 border-b cursor-pointer hover:bg-gray-50"
                onClick={() => setIsManaging(true)}
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium">Manage Tags</span>
              </div>
            )}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 border-emerald-500 focus-visible:ring-emerald-500"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {selectedTag && (
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-500"
                  onClick={() => handleSelectTag(null)}
                >
                  <X className="h-4 w-4" />
                  <span className="text-sm">Clear tag</span>
                </div>
              )}
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    selectedTag?.id === tag.id ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSelectTag(tag)}
                >
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-sm">{tag.name}</span>
                  {selectedTag?.id === tag.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              ))}
              {filteredTags.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No tags found
                </div>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
