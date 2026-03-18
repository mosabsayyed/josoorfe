import React, { useEffect, useRef } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const DRIVER_THEME_STYLES = `
  .driver-popover.driverjs-theme {
    background-color: var(--component-panel-bg) !important;
    color: var(--component-text-primary) !important;
    border: 1px solid var(--component-panel-border) !important;
    border-radius: 12px !important;
    padding: 24px !important;
    max-width: 450px !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7) !important;
    
    /* Pin the popover so it doesn't move with each icon */
    position: fixed !important;
    top: 50% !important;
    bottom: auto !important;
    transform: translateY(-50%) !important;
    margin: 0 !important;
  }

  /* Hide the arrow since the popover is now detached from the icons */
  .driver-popover-arrow {
    display: none !important;
  }
  
  [dir="rtl"] .driver-popover.driverjs-theme {
    left: 60px !important;
    right: auto !important;
  }
  
  [dir="ltr"] .driver-popover.driverjs-theme,
  :not([dir="rtl"]) .driver-popover.driverjs-theme {
    right: 60px !important;
    left: auto !important;
  }

  .driver-popover.driverjs-theme.welcome-popover {
    max-width: 500px !important;
    padding: 32px !important;
    text-align: center;
    border: 2px solid var(--component-text-accent) !important;
    /* Center the welcome popover */
    left: 50% !important;
    right: auto !important;
    transform: translate(-50%, -50%) !important;
  }
  .driver-popover.driverjs-theme.welcome-popover .driver-popover-title {
    font-size: 26px !important;
    margin-bottom: 16px !important;
  }
  .driver-popover.driverjs-theme.welcome-popover .driver-popover-description {
    font-size: 18px !important;
    line-height: 1.6 !important;
  }
  .driver-popover.driverjs-theme .driver-popover-title {
    font-size: 20px !important;
    font-weight: 700 !important;
    color: var(--component-text-accent) !important;
    margin-bottom: 12px !important;
  }
  .driver-popover.driverjs-theme .driver-popover-description {
    font-size: 16px !important;
    color: var(--component-text-secondary) !important;
    line-height: 1.6 !important;
  }
  .driver-popover.driverjs-theme .driver-popover-description ul {
    list-style-type: disc !important;
    padding-inline-start: 24px !important;
    margin-top: 8px !important;
    margin-bottom: 8px !important;
  }
  .driver-popover.driverjs-theme .driver-popover-description li {
    margin-bottom: 6px !important;
  }
  .driver-popover.driverjs-theme button {
    background-color: var(--component-bg-secondary) !important;
    color: var(--component-text-primary) !important;
    border: 1px solid var(--component-panel-border) !important;
    text-shadow: none !important;
    padding: 8px 16px !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    font-weight: 600 !important;
    font-size: 14px !important;
  }
  .driver-popover.driverjs-theme button:hover {
    background-color: var(--component-panel-border) !important;
  }
  .driver-popover.driverjs-theme button.driver-popover-next-btn {
    background-color: var(--component-text-accent) !important;
    color: var(--component-text-on-accent) !important;
    border: none !important;
  }
  .driver-popover.driverjs-theme button.driver-popover-next-btn:hover {
    background-color: var(--component-text-accent) !important;
    opacity: 0.9 !important;
  }
  .driver-popover {
    z-index: 100001 !important;
  }
  .jos-desktop[dir="rtl"] .driver-popover {
    text-align: right;
  }
  
  /* RTL overrides for the popover close button (the 'X') */
  [dir="rtl"] .driver-popover .driver-popover-close-btn {
    right: auto !important;
    left: 0 !important;
  }
  [dir="rtl"] .driver-popover-title {
    padding-left: 20px !important; 
    padding-right: 0 !important;
  }
  .jos-desktop[dir="ltr"] .driver-popover-title {
    padding-right: 20px !important;
  }

  .jos-desktop[dir="ltr"] .driver-popover {
    text-align: left;
  }
`;

interface DesktopOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'ar';
}

const DesktopOnboarding: React.FC<DesktopOnboardingProps> = ({ isOpen, onClose, language = 'en' }) => {
  const driverObj = useRef<any>(null);
  const isRTL = language === 'ar';

  useEffect(() => {
    const styleId = 'driver-theme-styles-desktop';
    let style = document.getElementById(styleId) as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.innerHTML = DRIVER_THEME_STYLES;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (driverObj.current) {
        driverObj.current.destroy();
        driverObj.current = null;
      }
      return;
    }

    // Define steps for each individual module, strictly row by row in layout order
    const steps: DriveStep[] = [
      {
        popover: {
          title: isRTL ? 'التنقل في مساحة العمل' : 'Workspace Navigation',
          description: isRTL 
            ? 'مرحباً في نظام جسور. صُمم هذا السطح كمدخل رئيسي للمكاتب الاستراتيجية والتشغيلية المترابطة عبر الرسم البياني المعرفي (Knowledge Graph).<br/><br/>تم ترتيب واجهة العمل بعناية لترافقك عبر دورة القيمة الكاملة للمؤسسة، بدءاً من الرؤية الاستراتيجية المطلقة وصولاً إلى التنفيذ التشغيلي المباشر.' 
            : 'Welcome to the Josoor workspace. This desktop acts as the primary interface to navigate the interconnected strategic and operational desks powered by the Enterprise Knowledge Graph.<br/><br/>The workspace is carefully arranged to guide you through the complete institutional value cycle, from top-level strategic vision down to direct operational execution.',
          popoverClass: 'driverjs-theme welcome-popover',
        }
      },
      {
        element: '#jos-icon-home',
        popover: {
          title: isRTL ? 'المركز الأونطولوجي' : 'Ontology Base',
          description: isRTL 
            ? '<strong>خريطة الهيكل المعرفي الأساسية</strong><br/>الأونطولوجي هو الهيكل البياني الذي يربط كافة مكونات النظام.<br/><br/><ul><li>يستعرض الخريطة الكاملة وتدفق الأهداف الاستراتيجية.</li><li>يربط السياسات العليا بأنشطة العمل ومقاييس الأداء.</li><li>يتيح لك فهم التداخلات المعقدة بين الإدارات في نافذة واحدة.</li></ul>' 
            : '<strong>The Core Organizational Map</strong><br/>The Ontology is the underlying data model connecting all enterprise components.<br/><br/><ul><li>Displays the structural map of strategic parameters.</li><li>Links macro policy instruments directly to operational targets.</li><li>Allows you to trace complex inter-departmental dependencies.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-observe',
        popover: {
          title: isRTL ? 'المراقبة (مكتب القطاع)' : 'Observe (Sector Desk)',
          description: isRTL 
            ? '<strong>المرحلة الأولى: رصد البيئة الكلية</strong><br/>يركز هذا المكتب الدخول في تفاصيل المحيط التشريعي للقطاع.<br/><br/>يُستخدم في:<br/><ul><li>تدوين أدوات ومواثيق السياسات التشريعية.</li><li>رسم سلاسل القيمة الخاصة بالقطاع بأكمله.</li><li>إدارة الهيئات وأصحاب المصلحة الخارجيين المؤثرين في العمل.</li></ul>' 
            : '<strong>Phase One: Macro Environment</strong><br/>This desk focuses on structurally mapping external legislative frameworks.<br/><br/>Use it to:<br/><ul><li>Structure regulatory policy instruments.</li><li>Map entire sector value chains.</li><li>Track external stakeholder entities and dependencies.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-decide',
        popover: {
          title: isRTL ? 'القرار (مكتب المؤسسة)' : 'Decide (Enterprise Desk)',
          description: isRTL 
            ? '<strong>المرحلة الثانية: تقييم البيئة الداخلية</strong><br/>يستعرض تفاصيل البنية التحتية الأساسية للمؤسسة واستعدادها التشغيلي.<br/><br/>يتضمن ذلك:<br/><ul><li>هيكلة الوحدات التنظيمية.</li><li>تصنيف مصفوفات القدرات الأساسية (L1/L2/L3).</li><li>تقييم تغطية الأنظمة التقنية (IT) المطلوبة لتفعيل القدرات المختلفة.</li></ul>' 
            : '<strong>Phase Two: Internal Assessment</strong><br/>It details the institution\'s core structural and operational readiness.<br/><br/>This includes:<br/><ul><li>Mapping interconnected organizational units.</li><li>Evaluating enterprise capability matrices (L1/L2/L3).</li><li>Assessing IT system overlays and technological gaps.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-deliver',
        popover: {
          title: isRTL ? 'التنفيذ (مختبر التخطيط)' : 'Deliver (Planning Lab)',
          description: isRTL 
            ? '<strong>مستوى العمل المباشر لحل الفجوات</strong><br/>هُنا تُترجم التصاميم المؤسسية المعرفية إلى أفعال ومشاريع حية.<br/><br/>المهام الأساسية:<br/><ul><li>تدوين واعتماد المبادرات الاستراتيجية.</li><li>تصميم المشاريع وحساب ميزانيات الإغلاق.</li><li>تحديد الفجوات النظامية وإقرار الإجراءات التصحيحية.</li></ul>' 
            : '<strong>Direct Execution Plane</strong><br/>This is where documented capabilities translate to actionable events and investments.<br/><br/>Key activities:<br/><ul><li>Establishing targeted strategic initiatives.</li><li>Closing systemic gaps via defined projects.</li><li>Resource allocation and intervention modeling.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-signals',
        popover: {
          title: isRTL ? 'الإشارات (مكتب الرقابة)' : 'Signals',
          description: isRTL 
            ? '<strong>محرك مراقبة المخاطر الحي</strong><br/>يعمل كجهاز إنذار مبكر لجميع الأنشطة التشغيلية والاستراتيجية.<br/><br/><ul><li>يستخلص ويعرض سجلات الإخفاقات التشغيلية.</li><li>يرصد المخالفات المباشرة للامتثال المؤسسي للسياسات.</li><li>يسجل ويحلل أحداث المخاطر عبر كافة عُقد النظام المعرفي.</li></ul>' 
            : '<strong>Live Risk Orchestration</strong><br/>Acts as the centralized early-warning system for the enterprise.<br/><br/><ul><li>Extracts active operational failure logs.</li><li>Identifies live policy compliance violations.</li><li>Monitors risk events spanning across all established graph nodes.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-reporting',
        popover: {
          title: isRTL ? 'التقارير' : 'Reporting',
          description: isRTL 
            ? '<strong>وحدة التجميع الكمي للإدارة العليا</strong><br/>واجهة استخراج البيانات القياسية من المعرفة المترابطة المعقدة.<br/><br/>تُتيح هذه الوحدة:<br/><ul><li>تجميع المخرجات في إحصائيات معتمدة واضحة.</li><li>عرض مؤشرات قياس الأداء (KPIs) التنفيذية المباشرة.</li><li>توفير صورة رقمية مختصرة وسهلة الفهم للتحليل الروتيني.</li></ul>' 
            : '<strong>Quantitative Aggregation Module</strong><br/>Standardized output engine bridging the semantic graph to traditional analytics.<br/><br/>Features include:<br/><ul><li>Querying complex semantics into structured tabular forms.</li><li>Rendering standard executive Key Performance Indicators (KPIs).</li><li>Generating clear numerical summaries for routine reporting.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-chat',
        popover: {
          title: isRTL ? 'المساعد التحليلي' : 'AI Graph Assistant',
          description: isRTL 
            ? '<strong>محرك البحث الأوتوماتيكي باستخدام Cypher</strong><br/>ليست مجرد واجهة حوارية، بل هي أداة ربط مباشر بقاعدة البيانات.<br/><br/><ul><li>تحلل أسئلتك نصياً وتولد أوامر برمجية بلغة Cypher.</li><li>تستعلم مباشرة من قاعدة بيانات Neo4j الحية.</li><li>تبني جداول، وشبكات بصرية، واستنتاجات دقيقة وفورية.</li></ul>' 
            : '<strong>Automated Cypher Search Engine</strong><br/>This is not a mere conversational bot; it is a direct interface to querying the raw data.<br/><br/><ul><li>Translates natural language questions into executable Cypher code.</li><li>Directly queries the live Neo4j database instances.</li><li>Generates bespoke node networks, tabular outputs, and verifiable insights.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-tutorials',
        popover: {
          title: isRTL ? 'الموسوعة المنهجية (الدروس)' : 'Methodology Encyclopedia (Tutorials)',
          description: isRTL 
            ? '<strong>مرجع الأسس العلمية للتحول المؤسسي</strong><br/>يحتوي هذا المكتب المتخصص مقالات وفصول منهجية تشرح لك المفاهيم التي تبنى بها المنصة.<br/><br/><ul><li>يعلمك أسس وعلوم إدارة التحول المؤسسي.</li><li>يشرح تفاصيل التصميم التنظيمي السليم.</li><li>يبني الأساس المعرفي اللازم للتعامل مع المفاهيم الاستراتيجية العميقة.</li></ul>' 
            : '<strong>Scientific Foundation Reference</strong><br/>This is a specialized encyclopedia containing the core concepts upon which the platform methodology is built.<br/><br/><ul><li>Teaches you the scientific fundamentals of true institutional transformation.</li><li>Explains the intricacies of correct organizational design.</li><li>Provides the deep domain knowledge required to master strategic concepts.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-settings',
        popover: {
          title: isRTL ? 'الإعدادات' : 'System Settings',
          description: isRTL 
            ? '<strong>وحدة تكوين النظام الأساسية</strong><br/>يتم من خلالها السيطرة على المتغيرات التقنية المركزية.<br/><br/><ul><li>التحكم بمفاتيح واجهات النماذج اللغوية (LLM).</li><li>تعديل إعدادات بروتوكول توجيه سياق الخوادم (MCP).</li><li>إدارة صلاحيات النظام وتكوين مسارات الربط الخلفية.</li></ul>' 
            : '<strong>Core Configuration Environment</strong><br/>Where underlying system variables and service integrations are controlled.<br/><br/><ul><li>Manage backend LLM provider credentials and keys.</li><li>Modify Context Protocol (MCP) routing specifications.</li><li>Oversee system roles, permissions, and fundamental connectivity.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-observability',
        popover: {
          title: isRTL ? 'المراقبة التقنية' : 'Observability',
          description: isRTL 
            ? '<strong>أدوات تشخيص صحة الخوادم</strong><br/>نافذة مخصصة للتحقق من أداء البنية التحتية بشكل مباشر.<br/><br/><ul><li>تعرض السجلات الخلفية والمخرجات التقنية بصورة حية.</li><li>تتتبع مسارات الأوامر (API Traces) لاكتشاف الأعطال.</li><li>تتيح قياس زمن الاستجابة وجودة التواصل بين الخوادم.</li></ul>' 
            : '<strong>Server Diagnostic Suite</strong><br/>A dedicated console for inspecting the active infrastructure health in real-time.<br/><br/><ul><li>Surfaces raw backend operational logs and error states.</li><li>Traces active API requests for deep debugging.</li><li>Measures node-query latencies and tracks server connectivity metrics.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-calendar',
        popover: {
          title: isRTL ? 'السياق الزمني' : 'Temporal Context',
          description: isRTL 
            ? '<strong>أداة التحكم المركزية بالزمن</strong><br/>تحتوي جسور على ذاكرة للبيانات الاستراتيجية مقسمة زمنياً.<br/><br/>يسمح هذا المكون بـ:<br/><ul><li>تخصيص سنة مالية محددة أو تغيير الربع السنوي.</li><li>تطبيق فلترة عليا على جميع معلومات المنصة بناءً على التاريخ المحدد.</li><li>عزل البيانات لتجنب تقاطع الخطط القديمة مع الحالية.</li></ul>' 
            : '<strong>Central Chronological Filter</strong><br/>Josoor maintains time-sliced memory for all enterprise data.<br/><br/>This allows you to:<br/><ul><li>Select specific fiscal years and operating quarters.</li><li>Instantly apply master filtering across all graph nodes globally.</li><li>Isolate data sets to ensure legacy capabilities don\'t overlap with current states.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        element: '#jos-icon-folder',
        popover: {
          title: isRTL ? 'سجل الملفات' : 'Documents',
          description: isRTL 
            ? '<strong>مستودع المخرجات الثابتة</strong><br/>أداة أرشفة منفصلة عن الرسوم البيانية الحية اليومية.<br/><br/><ul><li>يُمكنك من إدارة الجداول والتقارير المصدرة مسبقاً.</li><li>يحتفظ بسيناريوهات التخطيط الاستراتيجي السابقة للرجوع لها.</li><li>يعمل كأرشيف تاريخي يعفيك من إعادة الاستعلام اللحظي بشكل متكرر.</li></ul>' 
            : '<strong>Static Output Repository</strong><br/>An offline archival tool separated from live query graphs.<br/><br/><ul><li>Manage exported tabular records and final condition reports.</li><li>Maintain historically preserved strategic scenarios for reference.</li><li>Acts as a stable vault bypassing the need for recurrent live queries.</li></ul>',
          popoverClass: 'driverjs-theme',
          align: 'end'
        }
      },
      {
        popover: {
          title: isRTL ? 'مساعد التوضيح السياقي (؟)' : 'Contextual Helper (?)',
          description: isRTL 
            ? '<strong>شرح فوري للمصطلحات المعقدة</strong><br/>لقد قمنا بتضمين قاموس ذكي متصل داخل كل نافذة.<br/><br/>عند ضغط أيقونة (؟) الموجودة في الشريط العلوي:<br/><ul><li>يتم استدعاء مساعدة تحدد لك معاني المصطلحات العلمية في تلك الصفحة حصراً.</li><li>يقدم لك أمثلة بسيطة توضح كيفية العمل على ذلك المكون.</li><li>يُبقي تركيزك على العمل دون الحاجة للخروج وبحث معاني المتغيرات.</li></ul>' 
            : '<strong>Instant Contextual Dictionary</strong><br/>We embedded intelligent terminology assistance within each module\'s title bar.<br/><br/>Clicking the (?) icon:<br/><ul><li>Instantly defines methodology terminology specifically relevant to your active view.</li><li>Provides direct examples of how nodes function within that scope.</li><li>Eliminates confusion and keeps you actively focused during deep work.</li></ul>',
          popoverClass: 'driverjs-theme',
        }
      }
    ];

    driverObj.current = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: 'rgba(0,0,0,0.6)',
      nextBtnText: isRTL ? 'التالي' : 'Next',
      prevBtnText: isRTL ? 'السابق' : 'Previous',
      doneBtnText: isRTL ? 'إنهاء' : 'Done',
      progressText: isRTL ? '{{current}} من {{total}}' : '{{current}} of {{total}}',
      steps: steps,
      onDestroyStarted: () => {
        if (driverObj.current?.hasNextStep() && !window.confirm(isRTL ? "هل أنت متأكد من إنهاء الدليل؟" : "Are you sure you want to end the tour?")) {
          return; // Do nothing
        }
        driverObj.current.destroy();
        onClose();
      }
    });

    // small delay to ensure DOM is fully rendered
    setTimeout(() => {
        driverObj.current?.drive();
    }, 100);

    return () => {
      if (driverObj.current) {
        driverObj.current.destroy();
      }
    };
  }, [isOpen, onClose, isRTL]);

  return null;
};

export default DesktopOnboarding;
