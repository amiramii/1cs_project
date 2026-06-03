"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, MapPin, UserRound, XCircle } from "lucide-react";
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
import { formatDrfError, summarizeUpstreamError } from "@/lib/drfError";
import { cn } from "@/lib/utils";

type SessionShareAcceptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: SessionShareRequestRow | null;
  isAr: boolean;
  assignments: AssignmentApi[];
  todaySlots: ProfessorTimetableSession[];
  onResolved: () => void | Promise<void>;
};

function parseShareError(text: string, status: number): string {
  const summarized = summarizeUpstreamError(text, status);
  if (
    summarized.toLowerCase().includes("multipleobjectsreturned") ||
    text.toLowerCase().includes("multipleobjectsreturned")
  ) {
    return "Could not match module/group uniquely. Pick your teaching assignment from the list below.";
  }
  try {
    const payload = text ? JSON.parse(text) : null;
    const parsed = formatDrfError(payload, "");
    if (parsed) return parsed;
  } catch {
    /* keep summarized */
  }
  return summarized;
}

function assignmentLabel(a: AssignmentApi, isAr: boolean): string {
  const mod = a.module_name?.trim() || "—";
  const grp = a.group_name?.trim() || "—";
  const meta = [a.year_name, a.semester].filter(Boolean).join(" · ");
  return meta ? `${mod} · ${grp} (${meta})` : `${mod} · ${grp}`;
}

function findAssignmentForSlot(
  slot: ProfessorTimetableSession,
  assignments: AssignmentApi[]
): AssignmentApi | undefined {
  const sub = slot.subject?.trim().toLowerCase();
  const grp = slot.group?.trim().toLowerCase();
  if (!sub) return undefined;
  const exact = assignments.filter(
    (a) =>
      a.module_name?.trim().toLowerCase() === sub &&
      (!grp || a.group_name?.trim().toLowerCase() === grp)
  );
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return exact[0];
  return assignments.find((a) => a.module_name?.trim().toLowerCase() === sub);
}

export default function SessionShareAcceptDialog({
  open,
  onOpenChange,
  request,
  isAr,
  assignments,
  todaySlots,
  onResolved,
}: SessionShareAcceptDialogProps) {
  const [assignmentId, setAssignmentId] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [room, setRoom] = useState("");
  const [busy, setBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !request) return;
    setAssignmentId("");
    setTimeSlot("");
    setRoom("");
    setInlineError(null);
  }, [open, request?.id]);

  const sortedAssignments = useMemo(
    () =>
      [...assignments].sort((a, b) =>
        assignmentLabel(a, isAr).localeCompare(assignmentLabel(b, isAr))
      ),
    [assignments, isAr]
  );

  const selectedAssignment = useMemo(
    () =>
      sortedAssignments.find((a) => String(a.id) === assignmentId) ?? null,
    [sortedAssignments, assignmentId]
  );

  const applyTimetableSlot = (slot: ProfessorTimetableSession) => {
    const match = findAssignmentForSlot(slot, sortedAssignments);
    if (match) setAssignmentId(String(match.id));
    setTimeSlot(slot.time_slot?.trim() || "");
    setRoom(slot.room?.trim() || "—");
  };

  const handleRefuse = async () => {
    if (!request?.id) return;
    setBusy(true);
    setInlineError(null);
    try {
      const res = await patchSessionShareRefuse(request.id);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(parseShareError(text, res.status));
      }
      toast.success(isAr ? "تم رفض الطلب." : "Request refused.");
      onOpenChange(false);
      await onResolved();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : isAr
            ? "تعذر رفض الطلب."
            : "Could not refuse the request.";
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    if (!request?.id) return;
    const aid = Number.parseInt(assignmentId, 10);
    if (!Number.isFinite(aid) || aid <= 0) {
      const msg = isAr
        ? "اختر التعيين التدريسي (المادة + المجموعة)."
        : "Select your teaching assignment (module + group).";
      setInlineError(msg);
      toast.error(msg);
      return;
    }
    if (!timeSlot.trim()) {
      const msg = isAr ? "أدخل وقت الحصة." : "Enter the time slot.";
      setInlineError(msg);
      toast.error(msg);
      return;
    }
    setBusy(true);
    setInlineError(null);
    try {
      const res = await patchSessionShareAccept(request.id, {
        assignment_id: aid,
        module_name: selectedAssignment?.module_name?.trim(),
        group_name: selectedAssignment?.group_name?.trim(),
        time_slot: timeSlot.trim(),
        room: room.trim() || "—",
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(parseShareError(text, res.status));
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
      const msg =
        e instanceof Error
          ? e.message
          : isAr
            ? "تعذر قبول الطلب."
            : "Could not accept the request.";
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-[#51689A]/25 p-0 sm:max-w-lg">
        <div className="bg-[#1B2065] px-6 py-5 text-white">
          <DialogHeader className="space-y-2 text-start">
            <DialogTitle className="text-xl font-bold text-white">
              {isAr ? "طلب مشاركة حصة" : "Session share request"}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/85">
              {isAr
                ? "أحد زملائك يطلب تولّي إحدى حصصك اليوم. اختر الحصة ثم اقبل أو ارفض."
                : "A colleague asked to cover one of your sessions today. Pick the slot, then accept or refuse."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-start gap-3 rounded-xl border border-[#74A7BD]/40 bg-[#EEF6FA] px-4 py-3 dark:border-[#74A7BD]/30 dark:bg-[#1A2836]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#51689A] text-white">
              <UserRound className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#51689A] dark:text-[#9BA8C4]">
                {isAr ? "الأستاذ الطالب" : "Requesting professor"}
              </p>
              <p className="truncate text-base font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
                {request.requester_name?.trim() || "—"}
              </p>
              <p className="truncate text-sm text-[#51689A] dark:text-[#9BA8C4]">
                {request.requester_email}
              </p>
              {request.created_at ? (
                <p className="mt-1 text-xs text-[#51689A]/80 dark:text-[#9BA8C4]">
                  {new Date(request.created_at).toLocaleString(
                    isAr ? "ar-DZ" : "en-US"
                  )}
                </p>
              ) : null}
            </div>
          </div>

          {todaySlots.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#51689A] dark:text-[#9BA8C4]">
                {isAr ? "حصصك اليوم — تعبئة سريعة" : "Your slots today — quick fill"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {todaySlots.map((slot, i) => (
                  <button
                    key={`${slot.time_slot}-${slot.subject}-${i}`}
                    type="button"
                    className="rounded-lg border border-[#74A7BD]/50 bg-white px-3 py-2 text-start text-xs font-medium text-[#1B2065] shadow-sm transition hover:border-[#51689A] hover:bg-[#F6F9FB] dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7]"
                    onClick={() => applyTimetableSlot(slot)}
                  >
                    <span className="block font-semibold">{slot.subject}</span>
                    <span className="text-[#51689A] dark:text-[#9BA8C4]">
                      {slot.group} · {slot.time_slot}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-4 rounded-xl border border-[#51689A]/20 bg-[#F6F7FE]/60 p-4 dark:border-[#383F58] dark:bg-[#242A40]/40">
            <div className="space-y-1.5">
              <Label htmlFor="share-assignment" className="text-[#1B2065] dark:text-[#EEF4F7]">
                {isAr ? "تعيينك التدريسي" : "Your teaching assignment"}{" "}
                <span className="text-[#DF2D3E]">*</span>
              </Label>
              <Select value={assignmentId || undefined} onValueChange={setAssignmentId}>
                <SelectTrigger id="share-assignment" className="w-full bg-white dark:bg-[#1A2036]">
                  <SelectValue
                    placeholder={
                      isAr ? "المادة · المجموعة · السنة" : "Module · group · year"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sortedAssignments.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      {isAr ? "لا توجد تعيينات" : "No assignments"}
                    </SelectItem>
                  ) : (
                    sortedAssignments.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {assignmentLabel(a, isAr)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="share-slot" className="flex items-center gap-1.5 text-[#1B2065] dark:text-[#EEF4F7]">
                  <Clock className="size-3.5 text-[#51689A]" aria-hidden />
                  {isAr ? "الوقت" : "Time slot"}{" "}
                  <span className="text-[#DF2D3E]">*</span>
                </Label>
                <Input
                  id="share-slot"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  placeholder="09h30-11h"
                  className="bg-white dark:bg-[#1A2036]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="share-room" className="flex items-center gap-1.5 text-[#1B2065] dark:text-[#EEF4F7]">
                  <MapPin className="size-3.5 text-[#51689A]" aria-hidden />
                  {isAr ? "القاعة" : "Room"}
                </Label>
                <Input
                  id="share-room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder={isAr ? "A101" : "A101"}
                  className="bg-white dark:bg-[#1A2036]"
                />
              </div>
            </div>
          </div>

          {inlineError ? (
            <p
              role="alert"
              className="rounded-lg border border-[#DF2D3E]/35 bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C] dark:border-[#DF2D3E]/40 dark:bg-[#3A1A1F] dark:text-[#FCA5A5]"
            >
              {inlineError}
            </p>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-[#51689A]/15 bg-[#FAFBFE] px-6 py-4 sm:flex-row sm:justify-between dark:border-[#383F58] dark:bg-[#1A2036]">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className={cn(
              "order-2 w-full border-[#DF2D3E]/45 bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2] sm:order-1 sm:w-auto",
              "dark:border-[#DF2D3E]/40 dark:bg-[#3A1A1F] dark:text-[#FCA5A5] dark:hover:bg-[#4A2028]"
            )}
            onClick={() => void handleRefuse()}
          >
            <XCircle className="me-2 size-4" aria-hidden />
            {isAr ? "رفض الطلب" : "Refuse request"}
          </Button>
          <Button
            type="button"
            disabled={busy}
            className={cn(
              "order-1 w-full bg-[#16A34A] text-white hover:bg-[#15803D] sm:order-2 sm:w-auto",
              "dark:bg-[#22C55E] dark:hover:bg-[#16A34A]"
            )}
            onClick={() => void handleAccept()}
          >
            <CheckCircle2 className="me-2 size-4" aria-hidden />
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
