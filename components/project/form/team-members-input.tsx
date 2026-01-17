"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { TeamMember } from "@/lib/validations/project";

interface TeamMembersInputProps {
  value: TeamMember[];
  onChange: (members: TeamMember[]) => void;
}

/**
 * Input component for managing team members
 * Allows adding and removing team members with name and role
 */
export function TeamMembersInput({ value, onChange }: TeamMembersInputProps) {
  const t = useTranslations("project");
  const tCommon = useTranslations("common");

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");

  const addTeamMember = () => {
    if (newMemberName.trim() && newMemberRole.trim()) {
      onChange([
        ...value,
        { name: newMemberName.trim(), role: newMemberRole.trim() },
      ]);
      setNewMemberName("");
      setNewMemberRole("");
    }
  };

  const removeTeamMember = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTeamMember();
    }
  };

  return (
    <div className="space-y-4">
      <Label>{t("team")}</Label>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-md bg-surface-elevated"
            >
              <div>
                <p className="font-medium text-sm">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTeamMember(index)}
                className="text-destructive hover:text-destructive"
              >
                {tCommon("delete")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder={t("memberName")}
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          aria-label={t("memberName")}
        />
        <Input
          placeholder={t("memberRole")}
          value={newMemberRole}
          onChange={(e) => setNewMemberRole(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          aria-label={t("memberRole")}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addTeamMember}
          disabled={!newMemberName.trim() || !newMemberRole.trim()}
        >
          {tCommon("add")}
        </Button>
      </div>
    </div>
  );
}
