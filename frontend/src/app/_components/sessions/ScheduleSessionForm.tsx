"use client";

import * as React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { cn } from "@/lib/utils";
import type { AssignmentApi } from "@/lib/professorSessionData";

const UNSET = "__schedule_unset__";

const fieldLabelClass = "text-sm font-semibold text-[#1B2065F2]";

const selectTriggerClass =
  "h-11 w-full min-w-0 cursor-pointer rounded-lg border border-[#51689A]/45 bg-white px-3 text-sm text-[#1B2065F2] shadow-none " +
  "hover:bg-[#FEF9F9] focus-visible:border-[#1B2065] focus-visible:ring-2 focus-visible:ring-[#1B2065]/25 " +
  "data-[placeholder]:text-[#51689A]/80 [&_[data-slot=select-value]]:w-full [&_[data-slot=select-value]]:text-start";

const textInputClass =
  "h-11 w-full min-w-0 rounded-lg border border-[#51689A]/45 bg-white px-3 text-sm text-[#1B2065F2] shadow-none " +
  "hover:bg-[#FEF9F9] placeholder:text-[#51689A]/80 " +
  "focus:outline-none focus:border-[#1B2065] focus:ring-2 focus:ring-[#1B2065]/25 " +
  "transition-colors";

function assignmentLabelLine(a: AssignmentApi): string {
  const g = a.group_name?.trim() || "—";
  const y = a.year_name?.trim() || "—";
  const s = a.semester?.trim() || "—";
  const m = a.module_name?.trim() || "—";
  return `${g} - ${y} - ${s} - ${m}`;
}

function formatDateTimeButton(
  isAr: boolean,
  start: Dayjs,
  end: Dayjs
): string {
  if (!start.isValid() || !end.isValid()) return "—";
  const d = isAr
    ? start.locale("ar").format("D MMMM YYYY")
    : start.locale("en").format("MMM D, YYYY");
  const t1 = isAr
    ? start.format("h:mmA")
    : start.format("h:mm A");
  const t2 = isAr
    ? end.format("h:mmA")
    : end.format("h:mm A");
  return `${d} – ${t1} – ${t2}`;
}

export type ScheduleSessionFormProps = {
  isAr: boolean;
  assignments: AssignmentApi[];
  assignmentId: number | "";
  onAssignmentIdChange: (id: number | "") => void;
  classRoom: string;
  onClassRoomChange: (v: string) => void;
  sessionStart: Dayjs;
  onSessionStartChange: (v: Dayjs | null) => void;
  sessionEnd: Dayjs;
  onSessionEndChange: (v: Dayjs | null) => void;
};

/**
 * “Schedule your session” — one assignment select, class + date/time, Radix popover for date & times.
 */
export default function ScheduleSessionForm({
  isAr,
  assignments,
  assignmentId,
  onAssignmentIdChange,
  classRoom,
  onClassRoomChange,
  sessionStart,
  onSessionStartChange,
  sessionEnd,
  onSessionEndChange,
}: ScheduleSessionFormProps) {
  React.useEffect(() => {
    dayjs.locale(isAr ? "ar" : "en");
  }, [isAr]);

  const dateStr = sessionStart.isValid() ? sessionStart.format("YYYY-MM-DD") : "";
  const startTimeStr = sessionStart.isValid() ? sessionStart.format("HH:mm") : "08:00";
  const endTimeStr = sessionEnd.isValid() ? sessionEnd.format("HH:mm") : "10:00";

  const applyDate = (yMd: string) => {
    if (!yMd) return;
    const t = sessionStart.isValid() ? sessionStart : dayjs();
    const nextStart = dayjs(`${yMd}T${t.format("HH:mm:ss")}`);
    if (!nextStart.isValid()) return;
    onSessionStartChange(nextStart);
    if (sessionEnd.isValid()) {
      const nextEnd = dayjs(`${yMd}T${sessionEnd.format("HH:mm:ss")}`);
      if (nextEnd.isValid() && (nextEnd.isAfter(nextStart) || nextEnd.isSame(nextStart))) {
        onSessionEndChange(nextEnd);
      } else {
        onSessionEndChange(nextStart.add(2, "hour"));
      }
    }
  };

  const applyStartTime = (hm: string) => {
    if (!hm) return;
    const base = sessionStart.isValid() ? sessionStart : dayjs();
    const [h, m] = hm.split(":").map((x) => parseInt(x, 10) || 0);
    const next = base.hour(h).minute(m).second(0);
    if (next.isValid()) onSessionStartChange(next);
  };

  const applyEndTime = (hm: string) => {
    if (!hm || !sessionStart.isValid()) return;
    const d = sessionStart.format("YYYY-MM-DD");
    const [h, mm] = hm.split(":");
    const next = dayjs(`${d}T${h}:${mm}:00`);
    if (!next.isValid()) return;
    if (!next.isAfter(sessionStart)) {
      onSessionEndChange(sessionStart.add(2, "hour"));
    } else {
      onSessionEndChange(next);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div className="min-w-0">
        <Label htmlFor="sched-assignment" className={cn(fieldLabelClass, "mb-1.5 block")}>
          {isAr ? "الشعبة والمادة" : "Group and Module"}
        </Label>
        <Select
          value={assignmentId === "" ? UNSET : String(assignmentId)}
          onValueChange={(v) => {
            onAssignmentIdChange(v === UNSET ? "" : Number(v));
          }}
        >
          <SelectTrigger
            id="sched-assignment"
            className={selectTriggerClass + " h-11 py-0"}
            aria-label={isAr ? "تعيين تدريس" : "Teaching assignment"}
          >
            <SelectValue
              placeholder={
                isAr
                  ? "الشعبة - السنة - الفصل - المادة"
                  : "Group - Year - Semester - Module"
              }
            />
          </SelectTrigger>
          <SelectContent
            className={cn(
              "z-[400] max-h-72 w-[var(--radix-select-trigger-width)]",
              "border border-[#51689A]/25 bg-white/55 shadow-lg ring-1 ring-white/40",
              "backdrop-blur-2xl backdrop-saturate-150 dark:bg-popover/50 dark:ring-white/10"
            )}
            position="popper"
            sideOffset={4}
            align="start"
          >
            <SelectItem value={UNSET} className="text-[#51689A] focus:text-[#1B2065F2]">
              {isAr ? "اختر…" : "Select…"}
            </SelectItem>
            {assignments.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {assignmentLabelLine(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0">
          <Label htmlFor="sched-class" className={cn(fieldLabelClass, "mb-1.5 block")}>
            {isAr ? "القاعة" : "Class"}
          </Label>
          <input
            id="sched-class"
            type="text"
            autoComplete="off"
            className={textInputClass}
            placeholder={isAr ? "قاعة…" : "Salle…"}
            value={classRoom}
            onChange={(e) => onClassRoomChange(e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <span className={cn(fieldLabelClass, "mb-1.5 block")}>
            {isAr ? "التاريخ والوقت" : "Date and Time"}
          </span>
          <Popover.Root modal={false}>
            <Popover.Trigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  selectTriggerClass,
                  "h-11 w-full min-w-0 justify-between font-normal"
                )}
              >
                <span className="min-w-0 flex-1 truncate text-start text-[#1B2065F2]">
                  {formatDateTimeButton(isAr, sessionStart, sessionEnd)}
                </span>
                <div className="ms-1 flex shrink-0 items-center gap-1.5 text-[#51689A]">
                  <Calendar className="size-4" strokeWidth={1.75} />
                  <ChevronDown className="size-4 opacity-70" />
                </div>
              </Button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="z-[400] w-[min(100vw-2rem,20rem)] rounded-xl border border-[#51689A]/30 bg-white p-4 shadow-lg outline-none"
                side="bottom"
                sideOffset={6}
                align="end"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="space-y-3">
                  <div>
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#51689A]">
                      {isAr ? "التاريخ" : "Date"}
                    </span>
                    <input
                      type="date"
                      className={cn(
                        textInputClass,
                        "h-9 [color-scheme:light]"
                      )}
                      value={dateStr}
                      onChange={(e) => applyDate(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="mb-1 block text-xs text-[#51689A]">
                        {isAr ? "بداية" : "Start"}
                      </span>
                      <input
                        type="time"
                        className={cn(textInputClass, "h-9 [color-scheme:light]")}
                        value={startTimeStr}
                        onChange={(e) => applyStartTime(e.target.value)}
                        step={60}
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-[#51689A]">
                        {isAr ? "نهاية" : "End"}
                      </span>
                      <input
                        type="time"
                        className={cn(textInputClass, "h-9 [color-scheme:light]")}
                        value={endTimeStr}
                        onChange={(e) => applyEndTime(e.target.value)}
                        step={60}
                      />
                    </div>
                  </div>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>
    </div>
  );
}

/** Body sent to `POST /api/attendance/sessions/` (time strings accepted by DRF for `TimeField`). */
export function buildSessionCreateBody(
  assignment: number,
  start: Dayjs,
  end: Dayjs,
  classRoom: string
) {
  if (!start.isValid() || !end.isValid()) {
    throw new Error("Invalid date/time");
  }
  const d = start.format("YYYY-MM-DD");
  return {
    assignment,
    date: d,
    start_time: start.format("HH:mm:ss"),
    end_time: end.format("HH:mm:ss"),
    extra_fields: classRoom.trim() ? [classRoom.trim()] : [],
  };
}
