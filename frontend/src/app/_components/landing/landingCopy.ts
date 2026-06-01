import type { Language } from "@/lib/constants"

export type LandingCopy = {
  nav: { about: string; missions: string; whyUs: string; contacts: string }
  auth: { login: string; logout: string; dashboard: string; signIn: string }
  hero: {
    eyebrow: string
    title: string
    body: string
    cta: string
    learn: string
    scroll: string
  }
  about: {
    title: string
    subtitle: string
    p1: string
    p2: string
  }
  mission: { title: string; items: { title: string; body: string }[] }
  whyUs: {
    title: string
    subtitle: string
    p1: string
    p2: string
    p3: string
  }
  contacts: { title: string }
  footer: string
}

const missionItemsEn = [
  {
    title: "Absence & Session Management",
    body:
      "Run live sessions, capture attendance in seconds, and give professors a clear picture of presence, lateness, and absences across every module.",
  },
  {
    title: "Facial Recognition",
    body:
      "Offer secure, contactless check-in with facial recognition for faster queues, fewer manual errors, and a smoother experience for students.",
  },
  {
    title: "Schedule Uploading",
    body:
      "Import timetables from PDF, Excel, or CSV and publish student and professor schedules without retyping rows of data.",
  },
  {
    title: "Justification & Replacement Management",
    body:
      "Students submit justifications online; schooling staff review them and coordinate replacement sessions from one shared workflow.",
  },
] as const

const missionItemsAr = [
  {
    title: "إدارة الغياب والحصص",
    body:
      "افتح الحصص مباشرة، سجّل الحضور في ثوانٍ، وامنح الأساتذة رؤية واضحة للحضور والتأخر والغياب في كل مادة.",
  },
  {
    title: "التعرف على الوجه",
    body:
      "تسجيل حضور آمن بدون لمس مع التعرف على الوجه: طوابير أسرع، أخطاء أقل، وتجربة أفضل للطلاب.",
  },
  {
    title: "رفع الجداول",
    body:
      "استورد الجداول من PDF أو Excel أو CSV وانشر جداول الطلاب والأساتذة دون إعادة إدخال البيانات.",
  },
  {
    title: "مبررات الغياب والحصص البديلة",
    body:
      "يقدّم الطلاب المبررات عبر المنصة؛ يتولى طاقم التعليم المراجعة وتنسيق الحصص البديلة في مسار واحد.",
  },
] as const

export function getLandingCopy(language: Language): LandingCopy {
  if (language === "ar") {
    return {
      nav: {
        about: "من نحن",
        missions: "مهمتنا",
        whyUs: "لماذا نحن",
        contacts: "اتصل بنا",
      },
      auth: {
        login: "تسجيل الدخول",
        logout: "تسجيل الخروج",
        dashboard: "لوحة التحكم",
        signIn: "الدخول إلى Chekin",
      },
      hero: {
        eyebrow: "من Vicinity",
        title: "الحضور أوضح.",
        body:
          "Chekin منصة Vicinity للجامعات: الحصص، الغياب، الجداول، والمبررات في مكان واحد على الويب والجوال.",
        cta: "ابدأ الآن",
        learn: "اعرف المزيد",
        scroll: "عن Chekin",
      },
      about: {
        title: "من نحن",
        subtitle: "إدارة الغياب والحصص",
        p1:
          "يستبدل Chekin الدفاتر الورقية والجداول المتفرقة بمسار واحد: يفتح الأستاذ الحصة، يسجّل الطلاب حضورهم، ويُتابَع الغياب تلقائياً مع تنبيهات عند تجاوز الحدود.",
        p2:
          "يدير المشرفون القوائم والجداول؛ يراجع طاقم التعليم المبررات؛ يرى الطلاب حضورهم مباشرة عبر نفس التطبيق على الحرم أو الهاتف.",
      },
      mission: { title: "مهمتنا", items: [...missionItemsAr] },
      whyUs: {
        title: "لماذا نحن",
        subtitle: "Vicinity: تقنية قريبة منك",
        p1:
          "Vicinity شركة تقنية تصمّم وتطوّر منتجات رقمية للمؤسسات والفرق. نبني أدوات قريبة من العمل اليومي: سهلة التبنّي، متينة، ومبنية حول المستخدم. Chekin أحد منتجاتنا الرئيسية للتعليم العالي.",
        p2:
          "شعارنا ثعلب: حرف V في الشعار يُرسم كرأس ثعلب. يرمز الثعلب إلى الذكاء والتكيّف والحركة في بيئات معقّدة، وهي قيم نطبّقها في تصميم المنتجات. اسم Vicinity يعكس القرب من من يستخدمون برمجياتنا.",
        p3:
          "من منصات الحضور إلى أدوات مستقبلية على خارطة الطريق، نركّز على هندسة موثوقة وواجهات واضحة ودعم طويل الأمد للمؤسسات التي تثق بنا.",
      },
      contacts: { title: "اتصل بنا" },
      footer: "Vicinity · Chekin",
    }
  }

  return {
    nav: {
      about: "About Us",
      missions: "Missions",
      whyUs: "Why Us",
      contacts: "Contacts",
    },
    auth: {
      login: "Login",
      logout: "Logout",
      dashboard: "Dashboard",
      signIn: "Sign in to Chekin",
    },
    hero: {
      eyebrow: "By Vicinity",
      title: "Attendance made clear.",
      body:
        "Chekin is Vicinity's platform for universities: sessions, absences, schedules, and justifications in one place on web and mobile.",
      cta: "Get started",
      learn: "Learn more",
      scroll: "About Chekin",
    },
    about: {
      title: "About Us",
      subtitle: "Absence & Session Management",
      p1:
        "Chekin replaces paper registers and scattered spreadsheets with a single workflow: professors open a session, students check in, and absences are tracked automatically with alerts when thresholds are reached.",
      p2:
        "Admins manage rosters and schedules; schooling staff handle justifications; students see their own attendance in real time through the same responsive app on campus or on their phone.",
    },
    mission: { title: "Our Mission", items: [...missionItemsEn] },
    whyUs: {
      title: "Why Us",
      subtitle: "Vicinity: technology close to you",
      p1:
        "Vicinity is a tech company that designs and ships digital products for institutions and teams. We build tools that sit close to daily work: simple to adopt, solid under load, and shaped around real users. Chekin is one of our flagship products for higher education.",
      p2:
        "Our mark is a fox: in the logo, the letter V is drawn as a fox head. Foxes stand for sharp perception, adaptability, and moving wisely through complex environments, the same qualities we bring to product design. The name Vicinity reflects staying near the people who use our software.",
      p3:
        "From attendance platforms to future tools on our roadmap, we focus on dependable engineering, clear interfaces, and long-term support for the organizations that trust us.",
    },
    contacts: { title: "Contacts" },
    footer: "Vicinity · Chekin",
  }
}

export const LANDING_MISSION_IMAGES = [
  "/ourMission1.svg",
  "/ourMission2.svg",
  "/ourMission3.svg",
  "/ourMission4.svg",
] as const
