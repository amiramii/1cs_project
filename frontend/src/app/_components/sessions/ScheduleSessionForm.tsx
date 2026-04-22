"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
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

/** Sentinel for Radix Select (empty string is awkward as a controlled value). */
const UNSET = "__schedule_unset__";

const fieldLabelClass = "mb-1.5 block text-sm font-semibold text-[#1B2065]";

const selectTriggerClass =
  "h-9 w-full min-w-0 cursor-pointer rounded-lg border border-[#51689A]/45 bg-white px-3 text-sm text-[#1B2065] shadow-none " +
  "hover:bg-[#FEF9F9] focus-visible:border-[#1B2065] focus-visible:ring-2 focus-visible:ring-[#1B2065]/25 " +
  "data-[placeholder]:text-[#51689A]/80 [&_[data-slot=select-value]]:w-full [&_[data-slot=select-value]]:text-start";

const textInputClass =
  "h-9 w-full min-w-0 rounded-lg border border-[#51689A]/45 bg-white px-3 text-sm text-[#1B2065] shadow-none " +
  "hover:bg-[#FEF9F9] placeholder:text-[#51689A]/80 " +
  "focus:outline-none focus:border-[#1B2065] focus:ring-2 focus:ring-[#1B2065]/25 " +
  "transition-colors";

const datetimeFieldClass = cn(
  textInputClass,
  "box-border cursor-text font-sans [color-scheme:light] ps-2 pe-2",
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
  "[&::-webkit-calendar-picker-indicator]:opacity-60",
  "[&::-webkit-calendar-picker-indicator]:hover:opacity-100"
);

export type ScheduleSessionFormProps = {
  isAr: boolean;
  groupOptions: string[];
  moduleOptions: string[];
  selectedGroup: string;
  selectedModule: string;
  onGroupChange: (g: string) => void;
  onModuleChange: (m: string) => void;
  classRoom: string;
  onClassRoomChange: (v: string) => void;
  sessionStart: Dayjs;
  onSessionStartChange: (v: Dayjs | null) => void;
};

/**
 * Native date/time + shadcn selects — no MUI, no portaled poppers, works cleanly inside Radix `Dialog`.
 */
export default function ScheduleSessionForm({
  isAr,
  groupOptions,
  moduleOptions,
  selectedGroup,
  selectedModule,
  onGroupChange,
  onModuleChange,
  classRoom,
  onClassRoomChange,
  sessionStart,
  onSessionStartChange,
}: ScheduleSessionFormProps) {
  React.useEffect(() => {
    dayjs.locale(isAr ? "ar" : "en");
  }, [isAr]);

  const groupPlaceholder = isAr ? "الشعب" : "Groups";
  const modulePlaceholder = isAr ? "المواد" : "Modules";

  const datetimeLocalValue = sessionStart.isValid()
    ? sessionStart.format("YYYY-MM-DDTHH:mm")
    : dayjs().format("YYYY-MM-DDTHH:mm");

  const onDatetimeLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) return;
    const next = dayjs(v);
    if (next.isValid()) onSessionStartChange(next);
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="min-w-0">
        <span id="sched-group-label" className={fieldLabelClass}>
          {isAr ? "الشعبة" : "Group"}
        </span>
        <Select
          value={selectedGroup ? selectedGroup : UNSET}
          onValueChange={(v) => onGroupChange(v === UNSET ? "" : v)}
        >
          <SelectTrigger
            id="sched-group"
            aria-labelledby="sched-group-label"
            className={selectTriggerClass}
          >
            <SelectValue placeholder={groupPlaceholder} />
          </SelectTrigger>
          <SelectContent
            className="z-[300] max-h-72 w-[var(--radix-select-trigger-width)]"
            position="popper"
            sideOffset={4}
            align="start"
          >
            <SelectItem
              value={UNSET}
              className="text-[#51689A] focus:text-[#1B2065]"
            >
              {groupPlaceholder}
            </SelectItem>
            {groupOptions.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0">
        <span id="sched-module-label" className={fieldLabelClass}>
          {isAr ? "المادة" : "Module"}
        </span>
        <Select
          value={selectedModule ? selectedModule : UNSET}
          onValueChange={(v) => onModuleChange(v === UNSET ? "" : v)}
        >
          <SelectTrigger
            id="sched-module"
            aria-labelledby="sched-module-label"
            className={selectTriggerClass}
          >
            <SelectValue placeholder={modulePlaceholder} />
          </SelectTrigger>
          <SelectContent
            className="z-[300] max-h-72 w-[var(--radix-select-trigger-width)]"
            position="popper"
            sideOffset={4}
            align="start"
          >
            <SelectItem
              value={UNSET}
              className="text-[#51689A] focus:text-[#1B2065]"
            >
              {modulePlaceholder}
            </SelectItem>
            {moduleOptions.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0">
        <label htmlFor="sched-class" className={fieldLabelClass}>
          {isAr ? "القاعة" : "Class"}
        </label>
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
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor="sched-datetime"
            className="mb-0 text-sm font-semibold text-[#1B2065]"
          >
            {isAr ? "التاريخ والوقت" : "Date and time"}
          </label>
          <Calendar
            className="size-4 shrink-0 text-[#51689A]/80"
            aria-hidden
            strokeWidth={1.75}
          />
        </div>
        <div
          className="rounded-lg border border-[#51689A]/20 bg-gradient-to-b from-white to-[#F6F7FE]/60 p-0.5 shadow-sm"
        >
          <div className="flex flex-col gap-0.5 rounded-md bg-white/90 px-1 py-0.5">
            {sessionStart.isValid() ? (
              <p className="px-1.5 pt-1 text-[11px] leading-tight text-[#51689A]">
                {isAr
                  ? sessionStart.locale("ar").format("D MMMM YYYY — HH:mm")
                  : sessionStart.locale("en").format("ddd, MMM D, YYYY, h:mm A")}
              </p>
            ) : null}
            <input
              id="sched-datetime"
              type="datetime-local"
              dir="ltr"
              className={cn(datetimeFieldClass, "w-full bg-transparent")}
              value={datetimeLocalValue}
              onChange={onDatetimeLocalChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
