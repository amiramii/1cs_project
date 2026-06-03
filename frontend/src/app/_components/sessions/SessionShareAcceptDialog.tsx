"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssignmentApi } from "@/lib/professorSessionData";
import type { ProfessorTimetableSession } from "@/lib/professorScheduleToday";
import {
  patchSessionShareAccept,
  patchSessionShareRefuse,
  type SessionShareRequestRow,
} from "@/lib/checkinClient";
import { formatDrfError } from "@/lib/drfError";

type SessionShareAcceptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: SessionShareRequestRow | null;
  isAr: boolean;
  assignments: AssignmentApi[];
  todaySlots: ProfessorTimetableSession[];
  onResolved: () => void | Promise<void>;
};

export default function SessionShareAcceptDialog({
  open,
  onOpenChange,
  request,
  isAr,
  assignments,
  todaySlots,
  onResolved,
}: SessionShareAcceptDialogProps) {
  const [moduleName, setModuleName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [room, setRoom] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !request) return;
    setModuleName("");
    setGroupName("");
    setTimeSlot("");
    setRoom("");
  }, [open, request?.id]);

  const moduleOptions = useMemo(() => {
    const names = new Set<string>();
    for (const a of assignments) {
      const n = a.module_name?.trim();
      if (n) names.add(n);
    }
    return [...names].sort();
  }, [assignments]);

  const groupOptions = useMemo(() => {
    if (!moduleName.trim()) return [];
    const names = new Set<string>();
    for (const a of assignments) {
      if (a.module_name?.trim() !== moduleName) continue;
      const g = a.group_name?.trim();
      if (g) names.add(g);
    }
    return [...names].sort();
  }, [assignments, moduleName]);

  const applyTimetableSlot = (slot: ProfessorTimetableSession) => {
    setModuleName(slot.subject?.trim() || "");
    setGroupName(slot.group?.trim() || "");
    setTimeSlot(slot.time_slot?.trim() || "");
    setRoom(slot.room?.trim() || "—");
  };

  const handleRefuse = async () => {
    if (!request?.id) return;
    setBusy(true);
    try {
      const res = await patchSessionShareRefuse(request.id);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(formatDrfError(text ? JSON.parse(text) : text, text));
      }
      toast.success(isAr ? "تم رفض الطلب." : "Request refused.");
      onOpenChange(false);
      await onResolved();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : isAr
            ? "تعذر رفض الطلب."
            : "Could not refuse the request."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    if (!request?.id) return;
    if (!moduleName.trim() || !groupName.trim() || !timeSlot.trim()) {
      toast.error(
        isAr
          ? "أكمل المادة والمجموعة والوقت."
          : "Fill in module, group, and time slot."
      );
      return;
    }
    setBusy(true);
    try {
      const res = await patchSessionShareAccept(request.id, {
        module_name: moduleName.trim(),
        group_name: groupName.trim(),
        time_slot: timeSlot.trim(),
        room: room.trim() || "—",
      });
      const text = await res.text();
      if (!res.ok) {
        let payload: unknown = text;
        try {
          payload = text ? JSON.parse(text) : text;
        } catch {
          /* keep text */
        }
        throw new Error(formatDrfError(payload, text));
      }
      toast.success(
        isAr
          ? "تم قبول الطلب وإنشاء الحصة لليوم."
          : "Request accepted — session created for today."
      );
      window.dispatchEvent(new CustomEvent("chekin-notifications-refresh"));
      onOpenChange(false);
      await onResolved();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : isAr
            ? "تعذر قبول الطلب."
            : "Could not accept the request."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isAr ? "طلب مشاركة حصة" : "Session share request"}
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? `${request.requester_name ?? request.requester_email ?? "—"} يطلب ملء إحدى حصصك اليوم.`
              : `${request.requester_name ?? request.requester_email ?? "—"} wants to cover one of your sessions today.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <p className="font-medium text-foreground">
              {request.requester_name?.trim() || "—"}
            </p>
            <p className="text-muted-foreground">{request.requester_email}</p>
            {request.created_at ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(request.created_at).toLocaleString(
                  isAr ? "ar-DZ" : "en-US"
                )}
              </p>
            ) : null}
          </div>

          {todaySlots.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {isAr ? "حصصك اليوم (تعبئة سريعة)" : "Your slots today (quick fill)"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {todaySlots.map((slot, i) => (
                  <Button
                    key={`${slot.time_slot}-${slot.subject}-${i}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-auto py-1.5 text-xs"
                    onClick={() => applyTimetableSlot(slot)}
                  >
                    {slot.subject} · {slot.group} · {slot.time_slot}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="share-module">{isAr ? "المادة" : "Module"}</Label>
              <Select value={moduleName || undefined} onValueChange={setModuleName}>
                <SelectTrigger id="share-module" className="w-full">
                  <SelectValue placeholder={isAr ? "اختر…" : "Select…"} />
                </SelectTrigger>
                <SelectContent>
                  {moduleOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-group">{isAr ? "المجموعة" : "Group"}</Label>
              <Select
                value={groupName || undefined}
                onValueChange={setGroupName}
                disabled={!moduleName}
              >
                <SelectTrigger id="share-group" className="w-full">
                  <SelectValue placeholder={isAr ? "اختر…" : "Select…"} />
                </SelectTrigger>
                <SelectContent>
                  {groupOptions.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-slot">{isAr ? "الوقت" : "Time slot"}</Label>
              <Input
                id="share-slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="09h30-11h"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="share-room">{isAr ? "القاعة" : "Room"}</Label>
              <Input
                id="share-room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder={isAr ? "A101" : "A101"}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void handleRefuse()}
          >
            {isAr ? "رفض" : "Refuse"}
          </Button>
          <Button type="button" disabled={busy} onClick={() => void handleAccept()}>
            {busy
              ? isAr
                ? "جارٍ…"
                : "Working…"
              : isAr
                ? "قبول وإنشاء الحصة"
                : "Accept & create session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
