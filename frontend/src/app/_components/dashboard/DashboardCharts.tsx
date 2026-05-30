"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ABSENCE_SEVERITY_COLORS,
  type AbsenceSeverity,
} from "@/lib/moduleExclusionPolicy";
import { cn } from "@/lib/utils";
import type {
  AdminLikeDashboardCharts,
  DashboardChartPoint,
  DashboardTrendPoint,
  ProfessorDashboardCharts,
  SchoolingDashboardCharts,
  StudentDashboardCharts,
} from "@/lib/dashboardMetrics";

const CHART_CARD_CLASS =
  "gap-4 border-[#51689A]/20 bg-[#FEF9F9] py-5 shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]";

const SEMANTIC_CHART_COLORS: Record<string, string> = {
  present: "hsl(var(--chart-3))",
  absent: "hsl(var(--chart-4))",
  justified: "hsl(var(--chart-2))",
  excluded: "hsl(var(--chart-4))",
  notExcluded: "hsl(var(--chart-3))",
  pending: "hsl(var(--chart-3))",
  accepted: "hsl(var(--chart-2))",
  refused: "hsl(var(--chart-4))",
  justPending: "hsl(var(--chart-3))",
  profPending: "hsl(var(--chart-4))",
  justAccepted: "hsl(var(--chart-2))",
  justRefused: "hsl(var(--chart-5))",
};

const FALLBACK_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

function chartConfigFromPoints(points: DashboardChartPoint[]): ChartConfig {
  const config: ChartConfig = { value: { label: "Count" } };
  points.forEach((p, i) => {
    config[p.key] = {
      label: p.label,
      color:
        SEMANTIC_CHART_COLORS[p.key] ??
        FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    };
  });
  return config;
}

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(CHART_CARD_CLASS, className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-base text-[#1B2065] dark:text-[#EEF4F7]">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-[#51689A] dark:text-[#9BA8C4]">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 sm:px-6">{children}</CardContent>
    </Card>
  );
}

function EmptyChartHint({ isAr }: { isAr: boolean }) {
  return (
    <p className="py-10 text-center text-sm text-[#51689A] dark:text-[#9BA8C4]">
      {isAr ? "لا توجد بيانات كافية بعد." : "Not enough data to chart yet."}
    </p>
  );
}

function ChartsLoadingHint({ isAr }: { isAr: boolean }) {
  return (
    <p className="py-10 text-center text-sm text-[#51689A] dark:text-[#9BA8C4]">
      {isAr ? "جاري تحميل الرسوم…" : "Loading charts…"}
    </p>
  );
}

const SEVERITY_LEGEND: Array<{ severity: AbsenceSeverity; en: string; ar: string }> =
  [
    { severity: "ok", en: "Within limit", ar: "ضمن الحد" },
    { severity: "caution", en: "Watch", ar: "انتباه" },
    { severity: "warning", en: "Elevated", ar: "مرتفع" },
    { severity: "critical", en: "One away", ar: "غياب واحد قبل الاستبعاد" },
    { severity: "excluded", en: "Excluded", ar: "مستبعد" },
  ];

function ModuleSeverityBarChart({
  data,
  isAr,
  isRtl,
}: {
  data: DashboardChartPoint[];
  isAr: boolean;
  isRtl: boolean;
}) {
  if (!data.length) return <EmptyChartHint isAr={isAr} />;

  const rows = data.map((p) => ({
    label: p.label,
    value: p.value,
    key: p.key,
    severity: p.severity ?? "ok",
  }));

  const config = chartConfigFromPoints(
    rows.map((r) => ({ key: r.key, label: r.label, value: r.value }))
  );

  return (
    <div className="space-y-3">
      <ChartContainer
        config={config}
        className="min-h-[220px] w-full sm:min-h-[260px]"
      >
        <BarChart
          data={rows}
          accessibilityLayer
          margin={{ left: isRtl ? 8 : 4, right: isRtl ? 4 : 8 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={64}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {rows.map((row) => (
              <Cell
                key={row.key}
                fill={ABSENCE_SEVERITY_COLORS[row.severity]}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] text-[#51689A] dark:text-[#9BA8C4]">
        {SEVERITY_LEGEND.map((item) => (
          <li key={item.severity} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: ABSENCE_SEVERITY_COLORS[item.severity] }}
              aria-hidden
            />
            {isAr ? item.ar : item.en}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverviewBarChart({
  data,
  isAr,
  isRtl,
}: {
  data: DashboardChartPoint[];
  isAr: boolean;
  isRtl: boolean;
}) {
  if (!data.length) return <EmptyChartHint isAr={isAr} />;
  const config = chartConfigFromPoints(data);
  const rows = data.map((p) => ({
    label: p.label,
    value: p.value,
    key: p.key,
  }));

  return (
    <ChartContainer
      config={config}
      className="min-h-[220px] w-full sm:min-h-[240px]"
    >
      <BarChart
        data={rows}
        accessibilityLayer
        margin={{ left: isRtl ? 8 : 4, right: isRtl ? 4 : 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={64}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {rows.map((row) => (
            <Cell key={row.key} fill={`var(--color-${row.key})`} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function TrendAreaChart({
  data,
  isRtl,
  seriesLabel,
}: {
  data: DashboardTrendPoint[];
  isAr?: boolean;
  isRtl: boolean;
  seriesLabel: string;
}) {
  const config = {
    value: { label: seriesLabel, color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="min-h-[220px] w-full sm:min-h-[240px]"
    >
      <AreaChart
        data={data}
        accessibilityLayer
        margin={{ left: isRtl ? 8 : 4, right: isRtl ? 4 : 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          fill="var(--color-value)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function StatusPieChart({
  data,
  isAr,
}: {
  data: DashboardChartPoint[];
  isAr: boolean;
}) {
  if (!data.length) return <EmptyChartHint isAr={isAr} />;
  const config = chartConfigFromPoints(data);
  const rows = data.map((p) => ({
    key: p.key,
    label: p.label,
    value: p.value,
    fill: `var(--color-${p.key})`,
  }));

  return (
    <ChartContainer
      config={config}
      className="mx-auto min-h-[220px] w-full max-w-sm sm:min-h-[240px]"
    >
      <PieChart accessibilityLayer>
        <ChartTooltip
          content={<ChartTooltipContent hideLabel nameKey="key" />}
        />
        <Pie
          data={rows}
          dataKey="value"
          nameKey="key"
          innerRadius={52}
          outerRadius={80}
          paddingAngle={2}
        >
          {rows.map((row) => (
            <Cell key={row.key} fill={row.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

type ChartsSectionProps = {
  isAr: boolean;
  isRtl: boolean;
  loading?: boolean;
};

export function AdminLikeDashboardCharts({
  charts,
  isAr,
  isRtl,
  loading,
}: ChartsSectionProps & {
  charts: AdminLikeDashboardCharts | null;
}) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={isAr ? "الرسوم البيانية" : "Charts"}>
          <ChartsLoadingHint isAr={isAr} />
        </ChartCard>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title={isAr ? "نظرة عامة" : "Platform overview"}
        description={
          isAr
            ? "أعداد الأساتذة والطلاب والجداول والحصص."
            : "Professors, students, schedules, and today’s sessions."
        }
      >
        <OverviewBarChart
          data={charts?.overview ?? []}
          isAr={isAr}
          isRtl={isRtl}
        />
      </ChartCard>
      <ChartCard
        title={isAr ? "الحصص — 7 أيام" : "Sessions — last 7 days"}
        description={
          isAr
            ? "عدد الحصص المسجّلة يومياً."
            : "Daily count of scheduled sessions."
        }
      >
        <TrendAreaChart
          data={charts?.sessionsTrend ?? []}
          isAr={isAr}
          isRtl={isRtl}
          seriesLabel={isAr ? "حصص" : "Sessions"}
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-2"
        title={isAr ? "حالة الحضور" : "Attendance breakdown"}
        description={
          isAr
            ? "توزيع سجلات الحضور (حاضر / غائب / مبرر)."
            : "Distribution of attendance marks (present / absent / justified)."
        }
      >
        <StatusPieChart
          data={charts?.attendanceByStatus ?? []}
          isAr={isAr}
        />
      </ChartCard>
    </section>
  );
}

export function SchoolingDashboardCharts({
  charts,
  isAr,
  isRtl,
  loading,
}: ChartsSectionProps & {
  charts: SchoolingDashboardCharts | null;
}) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={isAr ? "الرسوم البيانية" : "Charts"}>
          <ChartsLoadingHint isAr={isAr} />
        </ChartCard>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title={isAr ? "عبء المراجعة" : "Review workload"}
        description={
          isAr
            ? "طلبات التبرير وغياب الأساتذة حسب الحالة."
            : "Justification and professor absence requests by status."
        }
      >
        <OverviewBarChart
          data={charts?.reviewWorkload ?? []}
          isAr={isAr}
          isRtl={isRtl}
        />
      </ChartCard>
      <ChartCard
        title={isAr ? "حالة المبررات" : "Justification status"}
        description={
          isAr
            ? "توزيع طلبات التبرير حسب الحالة."
            : "Breakdown of justification requests by status."
        }
      >
        <StatusPieChart
          data={charts?.justificationsByStatus ?? []}
          isAr={isAr}
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-2"
        title={isAr ? "طلبات غياب الأساتذة" : "Professor absence requests"}
        description={
          isAr
            ? "توزيع الطلبات حسب الحالة."
            : "Breakdown of professor absence requests by status."
        }
      >
        <StatusPieChart
          data={charts?.teacherAbsenceByStatus ?? []}
          isAr={isAr}
        />
      </ChartCard>
    </section>
  );
}

export function ProfessorDashboardCharts({
  charts,
  isAr,
  isRtl,
  loading,
}: ChartsSectionProps & {
  charts: ProfessorDashboardCharts | null;
}) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={isAr ? "الرسوم البيانية" : "Charts"}>
          <ChartsLoadingHint isAr={isAr} />
        </ChartCard>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title={isAr ? "مساحتك التدريسية" : "Your teaching snapshot"}
        description={
          isAr
            ? "حصص اليوم، طلابك، الجداول، والقاعات."
            : "Today’s sessions, roster size, schedules, and rooms."
        }
      >
        <OverviewBarChart
          data={charts?.overview ?? []}
          isAr={isAr}
          isRtl={isRtl}
        />
      </ChartCard>
      <ChartCard
        title={isAr ? "حصصك — 7 أيام" : "Your sessions — last 7 days"}
        description={
          isAr ? "نشاط الحصص خلال الأسبوع." : "Session activity over the past week."
        }
      >
        <TrendAreaChart
          data={charts?.sessionsTrend ?? []}
          isAr={isAr}
          isRtl={isRtl}
          seriesLabel={isAr ? "حصص" : "Sessions"}
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-2"
        title={isAr ? "الاستبعاد" : "Exclusion status"}
        description={
          isAr
            ? "نسبة الطلاب المستبعدين وغير المستبعدين في مجموعاتك."
            : "Excluded and not-excluded students in your groups."
        }
      >
        <StatusPieChart data={charts?.exclusionStatus ?? []} isAr={isAr} />
      </ChartCard>
    </section>
  );
}

export function StudentDashboardCharts({
  charts,
  isAr,
  isRtl,
  loading,
}: ChartsSectionProps & {
  charts: StudentDashboardCharts | null;
}) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={isAr ? "الرسوم البيانية" : "Charts"}>
          <ChartsLoadingHint isAr={isAr} />
        </ChartCard>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title={isAr ? "مبرراتك" : "Your justifications"}
        description={isAr ? "حسب حالة المراجعة." : "By review status."}
      >
        <StatusPieChart
          data={charts?.justificationsByStatus ?? []}
          isAr={isAr}
        />
      </ChartCard>
      <ChartCard
        title={isAr ? "غياب هذا الأسبوع" : "Absences this week"}
        description={
          isAr
            ? "عدد فترات الغياب المسجّلة يومياً."
            : "Absent slots recorded per day."
        }
      >
        <TrendAreaChart
          data={charts?.absencesTrend ?? []}
          isAr={isAr}
          isRtl={isRtl}
          seriesLabel={isAr ? "غياب" : "Absences"}
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-2"
        title={isAr ? "غياب حسب المادة" : "Absences by module"}
        description={
          isAr
            ? "ألوان توضّح مدى خطورة الغياب في كل مادة."
            : "Colors show how serious your absences are in each module."
        }
      >
        <ModuleSeverityBarChart
          data={charts?.absencesByModule ?? []}
          isAr={isAr}
          isRtl={isRtl}
        />
      </ChartCard>
    </section>
  );
}

