"use client";

import { useState } from "react";
import { Pencil, Check, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportPreviewProps {
  category: string;
  department: string;
  address: string;
  description: string;
  photoCount: number;
  onSubmit: () => void;
}

export function ReportPreview({
  category,
  department,
  address,
  description: initialDescription,
  photoCount,
  onSubmit,
}: ReportPreviewProps) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(initialDescription);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Report Preview
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold">{category}</div>
          <div className="text-xs text-muted-foreground">{department}</div>
          <div className="text-xs text-muted-foreground">{address}</div>
        </div>

        <div className="relative">
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button
                size="sm"
                variant="ghost"
                className="self-end text-xs"
                onClick={() => setEditing(false)}
              >
                <Check className="mr-1 h-3 w-3" />
                Done
              </Button>
            </div>
          ) : (
            <div className="group">
              <p className="text-sm leading-relaxed">{description}</p>
              <button
                className="absolute -right-1 -top-1 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {photoCount > 0 && (
          <div className="flex gap-2">
            {Array.from({ length: photoCount }).map((_, i) => (
              <div
                key={i}
                className="flex h-14 w-14 items-center justify-center rounded-md bg-muted"
              >
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        <Button className="mt-1" onClick={onSubmit}>
          Submit to City of Vancouver
        </Button>
      </CardContent>
    </Card>
  );
}
