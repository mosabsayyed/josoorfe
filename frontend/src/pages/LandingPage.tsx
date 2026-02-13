import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { supabase } from '../lib/supabaseClient';

// Landing page section components
import Hero from '../components/landing/Hero';
import NoNoise from '../components/landing/NoNoise';
import Claims from '../components/landing/Claims';
import Promise from '../components/landing/Promise';
import Platform from '../components/landing/Platform';
import Architecture from '../components/landing/Architecture';
import BetaForm from '../components/landing/BetaForm';

export default function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const richFullName = `${formData.name} | Org: ${formData.organization} | Role: ${formData.role}`;

      const { data, error} = await supabase
        .from('users_pending')
        .insert([
          {
            email: formData.email,
            password: 'pending-approval-' + Date.now(),
            full_name: richFullName,
            role: 'user',
            is_active: false
          }
        ]);

      if (error) throw error;

      alert(language === 'en'
        ? 'Application submitted! We will review and contact you within 48 hours.'
        : 'تم تقديم الطلب! سنقوم بالمراجعة والتواصل معك خلال 48 ساعة.');

      setFormData({ name: '', email: '', organization: '', role: '' });

    } catch (err: any) {
      console.error('Registration error:', err);
      alert(language === 'en' 
        ? 'Error submitting request. Please try again or contact support.' 
        : 'خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.');
    }
  };

  const t = {
    hero: {
      title: language === 'en' ? 'JOSOOR' : 'جسور',
      subtitle: language === 'en' ? 'Decision Intelligence for Highly Regulated Sectors' : 'ذكاء القرار للقطاعات عالية التنظيم',
      badge: language === 'en' ? "KSA's Vision 2030 OS" : 'نظام التشغيل لرؤية السعودية 2030'
    },
    noNoise: {
      title: language === 'en' ? 'No Noise. All Signal.' : 'لا ضوضاء. كل إشارة.',
      subtitle: language === 'en'
        ? 'Is your team chasing reports 30hrs a week? Ad-hocs are your norm? No alignment on "priorities"? Best people leaving? Change activities failing? Complexity is always one step ahead?'
        : 'هل يطارد فريقك التقارير 30 ساعة في الأسبوع؟ التقارير المخصصة هي القاعدة؟ لا توافق على "الأولويات"؟ أفضل الناس يغادرون؟ أنشطة التغيير تفشل؟ التعقيد دائماً متقدم بخطوة؟',
      swagger: language === 'en' ? 'Great!' : 'عظيم!',
      closing: language === 'en'
        ? "Let's transform Complexity into your most valuable Asset!"
        : 'دعنا نحول التعقيد إلى أثمن أصولك!'
    },
    claims: {
      tag: language === 'en' ? 'Heard It Before?' : 'سمعته من قبل؟',
      title: language === 'en' ? 'See the difference.' : 'انظر الفرق.',
      subtitle: language === 'en'
        ? 'What makes Josoor fundamentally different from others in this space.'
        : 'ما يجعل جسور مختلفاً بشكل أساسي عن الآخرين في هذا المجال.',
      items: [
        language === 'en'
          ? '<b><em>Built with AIs</em> for humans from the ground up</b> — Every structure is machine-native. Every interface is human-intuitive.'
          : '<b><em>بني مع الذكاء الاصطناعي</em> للبشر من الصفر</b> - كل بنية أصلية للآلة. كل واجهة بديهية للإنسان.',
        language === 'en'
          ? '<b>Scalable to multi-Sectors and Entities</b> — one Josoor instance adapts to any government entity without rebuilding.'
          : '<b>قابل للتوسع إلى قطاعات وكيانات متعددة</b> - نسخة واحدة من جسور تتكيف مع أي كيان حكومي دون إعادة بناء.',
        language === 'en'
          ? "<b>Tailored for the Vision and its objectives/KPIs</b> — national methodologies and sectorial programs are first-class objects, not afterthoughts."
          : '<b>مصمم للرؤية وأهدافها/مؤشرات الأداء</b> - المنهجيات الوطنية والبرامج القطاعية هي كائنات من الدرجة الأولى، وليست أفكاراً لاحقة.',
        language === 'en'
          ? '<b>Native Arabic (and soon multi-accent)</b> — built for Arabic-first government context.'
          : '<b>عربي أصلي (وقريباً متعدد اللهجات)</b> - مبني لسياق حكومي عربي أولاً.',
        language === 'en'
          ? '<b>One definition, one version, one source of Priorities</b> — take opinions out of the dialogue. Everyone sees the same truth.'
          : '<b>تعريف واحد، إصدار واحد، مصدر واحد للأولويات</b> - أخرج الآراء من الحوار. الجميع يرى نفس الحقيقة.',
        language === 'en'
          ? '<b>Frontier Knowledge Graphing to model complexity</b> — relationships between KPIs, initiatives, risks, and resources are modelled as a living graph, not flat tables.'
          : '<b>رسم معرفي حدودي لنمذجة التعقيد</b> - العلاقات بين مؤشرات الأداء والمبادرات والمخاطر والموارد منمذجة كرسم حي، وليس جداول مسطحة.',
        language === 'en'
          ? '<b>KSA Public-Sector\'s first "Ontology" IP</b> — a reusable, scalable knowledge framework that grows smarter via guided AI learning.'
          : '<b>أول "أنطولوجيا" للقطاع العام السعودي</b> - إطار معرفي قابل لإعادة الاستخدام والتوسع ينمو بذكاء عبر التعلم الموجه للذكاء الاصطناعي.'
      ]
    },
    promise: {
      tag: language === 'en' ? 'The Promise' : 'الوعد',
      title: language === 'en' ? 'Same people. Different reality.' : 'نفس الناس. واقع مختلف.',
      subtitle: language === 'en' ? 'What changes for each person on your team.' : 'ما يتغير لكل شخص في فريقك.',
      personas: [
        {
          role: language === 'en' ? 'Vice Minister — Strategic Leadership' : 'نائب الوزير - القيادة الاستراتيجية',
          before: language === 'en'
            ? 'Forced to micromanage. Problems escalate before they reach him. Surprises in the minister\'s office.'
            : 'مجبر على الإدارة الدقيقة. المشاكل تتصاعد قبل أن تصل إليه. مفاجآت في مكتب الوزير.',
          after: language === 'en'
            ? 'Closing deals. Approving directions. Risks surface early with actions ready. The board deck builds itself.'
            : 'إغلاق الصفقات. الموافقة على الاتجاهات. المخاطر تظهر مبكراً مع الإجراءات جاهزة. عرض المجلس يبني نفسه.'
        },
        {
          role: language === 'en' ? 'Business Manager — Capability Owner' : 'مدير الأعمال - مالك القدرة',
          before: language === 'en'
            ? 'Juggling strategy priorities vs operational realities. Less time with stakeholders due to weekly reports'
            : 'التوفيق بين أولويات الاستراتيجية والواقع التشغيلي. وقت أقل مع أصحاب المصلحة بسبب التقارير الأسبوعية',
          after: language === 'en'
            ? 'On-site with stakeholders. Status auto-populates. Confirms with one tap on WhatsApp. Done.'
            : 'في الموقع مع أصحاب المصلحة. الحالة تملأ تلقائياً. يؤكد بنقرة واحدة على واتساب. تم.'
        },
        {
          role: language === 'en' ? 'Strategy Manager — Planning & Performance' : 'مدير الاستراتيجية - التخطيط والأداء',
          before: language === 'en'
            ? 'Firefighting. Can\'t think about next year because this quarter\'s Adaa submission isn\'t done.'
            : 'مكافحة الحرائق. لا يمكن التفكير في العام القادم لأن تقديم أداء هذا الربع لم ينته.',
          after: language === 'en'
            ? 'Planning new sectors, partnerships, targets. The quarterly report drafts itself. Strategy, not admin.'
            : 'التخطيط لقطاعات جديدة، شراكات، أهداف. التقرير الربع سنوي يكتب نفسه. استراتيجية، وليس إدارة.'
        },
        {
          role: language === 'en' ? 'PMO Director — Governance & Delivery' : 'مدير PMO - الحوكمة والتسليم',
          before: language === 'en'
            ? 'Reports nobody reads. Blamed for overruns he flagged 3 months ago. Team of 4 is now 3.'
            : 'تقارير لا أحد يقرأها. يُلام على التجاوزات التي أبلغ عنها قبل 3 أشهر. فريق من 4 أصبح 3.',
          after: language === 'en'
            ? 'Focused on future risks. AI handles chasing. His team stays because the job finally makes sense.'
            : 'يركز على المخاطر المستقبلية. الذكاء الاصطناعي يتولى المطاردة. فريقه يبقى لأن الوظيفة أخيراً منطقية.'
        }
      ]
    },
    platform: {
      tag: language === 'en' ? 'The Platform' : 'المنصة',
      title: language === 'en' ? 'Three modes. Always running.' : 'ثلاثة أوضاع. تعمل دائماً.',
      subtitle: language === 'en'
        ? 'From national KPIs to individual deliverables — tightly linked.'
        : 'من مؤشرات الأداء الوطنية إلى التسليمات الفردية - مرتبطة بإحكام.',
      modes: [
        {
          title: language === 'en' ? 'Watch' : 'راقب',
          desc: language === 'en'
            ? 'Not just what\'s red — catches what <em>looks green but is quietly declining</em>. Training drops, HR shrugs, Josoor traces the chain to the Minister\'s phone. You find out now, not in 3 months.'
            : 'ليس فقط ما هو أحمر - يلتقط ما <em>يبدو أخضر لكنه يتراجع بهدوء</em>. التدريب ينخفض، الموارد البشرية تتجاهل، جسور يتتبع السلسلة إلى هاتف الوزير. تكتشف الآن، وليس بعد 3 أشهر.'
        },
        {
          title: language === 'en' ? 'Decide' : 'قرر',
          desc: language === 'en'
            ? 'AI traces root cause and cascading impact across the map. The <em>full chain</em> from failing deliverable to national KPI, plus concrete options with outcomes. No guessing, all math.'
            : 'الذكاء الاصطناعي يتتبع السبب الجذري والتأثير المتتالي عبر الخريطة. <em>السلسلة الكاملة</em> من التسليم الفاشل إلى مؤشر الأداء الوطني، بالإضافة إلى خيارات ملموسة مع النتائج. لا تخمين، كل رياضيات.'
        },
        {
          title: language === 'en' ? 'Deliver' : 'نفذ',
          desc: language === 'en'
            ? 'Weekly priorities synced with Strategic Priorities. 4 out of 42 items matter this week — <em>focus</em>. True critical path drives system flags with high confidence'
            : 'الأولويات الأسبوعية متزامنة مع الأولويات الاستراتيجية. 4 من 42 عنصر مهم هذا الأسبوع - <em>التركيز</em>. المسار الحرج الحقيقي يقود علامات النظام بثقة عالية'
        }
      ]
    },
    architecture: {
      tag: language === 'en' ? 'The Architecture' : 'البنية',
      title: language === 'en' ? 'Designed around data you have today' : 'مصمم حول البيانات التي لديك اليوم',
      intro: language === 'en'
        ? 'No new data lake. No 18-month integration. Josoor is an <b>overlay</b> that builds bridges between your existing systems and stakeholders — a true information superhighway traversed by powerful LLMs, transforming <b>data complexity into strategic insights</b> and siloed stakeholders into an aligned powerhouse.'
        : 'لا بحيرة بيانات جديدة. لا تكامل لمدة 18 شهراً. جسور عبارة عن <b>طبقة</b> تبني جسور بين أنظمتك وأصحاب المصلحة الحاليين - طريق معلومات سريع حقيقي يسلكه LLMs قوية، محولة <b>تعقيد البيانات إلى رؤى استراتيجية</b> وأصحاب المصلحة المعزولين إلى قوة متماسكة.',
      layers: [
        { name: language === 'en' ? 'Strategy' : 'الاستراتيجية', desc: language === 'en' ? 'Objectives, KPIs' : 'الأهداف، مؤشرات الأداء' },
        { name: language === 'en' ? 'Sector Operations' : 'عمليات القطاع', desc: language === 'en' ? 'Your value chain' : 'سلسلة القيمة الخاصة بك' },
        { name: language === 'en' ? 'Enterprise Operations' : 'عمليات المؤسسة', desc: language === 'en' ? 'Org, Process, Systems, Vendors' : 'المنظمة، العملية، الأنظمة، الموردين' },
        { name: language === 'en' ? 'Projects Portfolio' : 'محفظة المشاريع', desc: language === 'en' ? 'Closing capability gaps' : 'إغلاق فجوات القدرة' }
      ],
      engines: [
        {
          title: language === 'en' ? 'BUILD — Are we building on time?' : 'بناء - هل نبني في الوقت المحدد؟',
          desc: language === 'en'
            ? 'For each capability under construction, checks every project closing its gaps. Calculates <b>build exposure</b> from real dates. No AI opinion — math.'
            : 'لكل قدرة قيد البناء، يتحقق من كل مشروع يغلق فجواته. يحسب <b>التعرض للبناء</b> من التواريخ الفعلية. لا رأي للذكاء الاصطناعي - رياضيات.'
        },
        {
          title: language === 'en' ? 'OPERATE — Are we running healthy?' : 'تشغيل - هل نعمل بصحة؟',
          desc: language === 'en'
            ? 'Scores people + process + tools. Two consecutive drops, even while green? <b>Forced amber.</b> Catches decline before red.'
            : 'يسجل الناس + العملية + الأدوات. انخفاضان متتاليان، حتى لو كان أخضر؟ <b>عنبر قسري.</b> يلتقط التراجع قبل الأحمر.'
        }
      ]
    },
    beta: {
      tag: language === 'en' ? 'Beta Launch' : 'إطلاق تجريبي',
      title: language === 'en' ? 'Ready to hear more?' : 'جاهز لسماع المزيد؟',
      subtitle: language === 'en'
        ? 'Josoor is in its private limited beta phase. Register your interest now.'
        : 'جسور في مرحلته التجريبية الخاصة المحدودة. سجل اهتمامك الآن.',
      form: {
        name: language === 'en' ? 'Full name' : 'الاسم الكامل',
        email: language === 'en' ? 'Work email' : 'بريد العمل',
        org: language === 'en' ? 'Organization name' : 'اسم المنظمة',
        role: language === 'en' ? 'Your role' : 'دورك',
        roleOptions: language === 'en'
          ? ['Vice Minister / Undersecretary', 'Strategy & Planning Director', 'PMO Director / Manager', 'Business / Capability Owner', 'IT / Digital Transformation', 'Other']
          : ['نائب وزير / وكيل', 'مدير استراتيجية وتخطيط', 'مدير/مدير PMO', 'مالك عمل/قدرة', 'تقنية معلومات/تحول رقمي', 'آخر'],
        submit: language === 'en' ? 'Apply for Private Beta →' : 'تقدم للنسخة التجريبية الخاصة ←'
      },
      note: language === 'en'
        ? 'Limited spots. KSA government entities only. We\'ll respond within 48 hours.'
        : 'أماكن محدودة. كيانات حكومية سعودية فقط. سنرد خلال 48 ساعة.'
    },
    footer: {
      rights: language === 'en' ? '© 2026 AI Twin Tech' : '© 2026 AI Twin Tech'
    }
  };

  // Inject CSS for the landing page
  useEffect(() => {
    const css = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap');
      
      :root {
        --component-bg-primary: #111827;
        --component-panel-bg: rgba(31, 41, 55, 0.6); /* Glass effect increased */
        --component-panel-border: rgba(255, 255, 255, 0.1);
        --component-text-primary: #F9FAFB;
        --component-text-secondary: #D1D5DB;
        --component-text-muted: #9CA3AF;
        --component-text-accent: var(--component-text-accent);
        --component-text-on-accent: #111827;
      }

      html, body {
        overflow-y: auto !important; /* FORCE SCROLLING */
        height: auto !important;
        min-height: 100vh;
      }

      .landing-page {
        background: var(--component-bg-primary);
        color: var(--component-text-primary);
        font-family: "Inter", sans-serif;
        overflow-x: hidden;
        overflow-y: auto;
        line-height: 1.5;
        min-height: 100vh;
        position: relative;
      }
      
      .landing-page * {
        box-sizing: border-box;
      }

      /* HERO SECTION */
      .hero-section {
        position: relative;
        width: 100%;
        font-weight: 400;
        justify-content: center;
        overflow-y: auto;
        padding-bottom: 60px;
        flex-direction: row;
        margin-bottom: 0px;
      }

      .hero-background-video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 0;
        /* Fallback gradient if video fails */
        background: radial-gradient(circle at center, #1f2937 0%, #111827 100%);
      }
      
      .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(17, 24, 39, 0.5); /* Dimming overlay */
        z-index: 1;
      }

      .hero-content {
        position: relative;
        z-index: 2;
        max-width: 800px;
        text-align: left;
        margin-left: 40px;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 0 20px;
      }

      .hero-title {
        font: 48px/67.2px "Inter", sans-serif;
        color: #FFFFFF;
        margin-bottom: 24px;
        text-shadow: 0 4px 20px rgba(0,0,0,0.5);
        width: auto;
        align-self: start;
        text-align: left;
      }

      .hero-subtitle {
        font: 400 20px/1.5 "Inter", sans-serif;
        color: #E5E7EB;
        margin-bottom: 40px;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }

      .scroll-indicator {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2;
        animation: bounce 2s infinite;
        opacity: 0.7;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
        40% {transform: translateX(-50%) translateY(-10px);}
        60% {transform: translateX(-50%) translateY(-5px);}
      }

      #background-image {
        position: absolute;
        top: 85vh; /* Push vector down below hero */
        left: 50%;
        transform: translateX(-50%);
        width: 1278px;
        pointer-events: none;
        z-index: 0;
        display: block;
        opacity: 0.3;
      }

      #main-content {
        position: relative;
        z-index: 1;
        padding-top: 0;
      }

      section {
        padding: 0.75rem 2rem;
        position: relative;
        background: transparent;
      }

      section.content-centered {
        max-width: 1100px;
        margin: 0 auto;
      }

      .section-content-box {
        background-color: var(--component-panel-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 12px;
        border-radius: 16px;
        border: 1px solid var(--component-panel-border);
        display: inline-block;
        width: 100%;
        transition: transform 0.3s ease;
      }

      .section-grid {
        display: grid;
        gap: 16px;
        align-items: center;
        grid-template-columns: 1fr 1fr;
      }

      .landing-page h1 {
        font: 700 56px/1.2 "Inter", sans-serif;
        color: var(--component-text-primary);
        margin-bottom: 24px;
      }

      .landing-page h2 {
        font: 700 42px/1.2 "Inter", sans-serif; /* Larger H2 */
        color: var(--component-text-primary);
        margin-bottom: 20px;
      }

      .subtitle {
        font: 400 18px/28px "Inter", sans-serif;
        color: var(--component-text-secondary);
        margin-bottom: 32px;
        max-width: 700px;
      }

      .screenshot-container {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        /* Removed background color to ensure transparency */
        background: transparent; 
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;
      }
      
      .screenshot-container:hover {
        transform: translateY(-5px);
      }

      .screenshot-container img {
        width: 100%;
        height: auto;
        display: block;
      }

      .microcopy-bullets, .value-bullets {
        list-style: none;
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px; 
      }

      .microcopy-bullets li, .value-bullets li {
        font: 400 16px/24px "Inter", sans-serif; /* Slightly larger text */
        color: var(--component-text-secondary);
        padding-left: 28px;
        padding-right: 0;
        position: relative;
      }
      
      /* RTL support for bullets */
      [dir="rtl"] .microcopy-bullets li, [dir="rtl"] .value-bullets li {
        padding-left: 0;
        padding-right: 28px;
      }

      .microcopy-bullets li:before {
        content: "→";
        position: absolute;
        left: 0;
        color: var(--component-text-accent);
        font-weight: 600;
        font-size: 18px;
      }
      
      [dir="rtl"] .microcopy-bullets li:before {
        left: auto;
        right: 0;
        content: "←";
      }

      .value-bullets li:before {
        content: "✓";
        position: absolute;
        left: 0;
        color: var(--component-text-accent);
        font-weight: 600;
        font-size: 18px;
      }
      
      [dir="rtl"] .value-bullets li:before {
        left: auto;
        right: 0;
      }

      .three-panel-strip {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-top: 40px;
      }

      .panel {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        background: transparent;
      }

      .panel img {
        width: 100%;
        height: auto;
        display: block;
      }

      .panel-caption {
        font: 600 14px/20px "Inter", sans-serif;
        color: var(--component-text-accent);
        padding: 12px 0;
        margin-top: 8px;
      }

      .panel-description {
        font: 400 13px/20px "Inter", sans-serif;
        color: var(--component-text-secondary);
        margin-top: 6px;
        line-height: 1.6;
      }

      .architecture-callouts {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 32px;
        margin-top: 40px;
      }

      .callout {
        padding: 24px;
        background: rgba(31, 41, 55, 0.5);
        border-left: 3px solid var(--component-text-accent);
        border-radius: 6px;
      }
      
      [dir="rtl"] .callout {
        border-left: none;
        border-right: 3px solid var(--component-text-accent);
      }

      .callout-label {
        font: 600 14px/20px "Inter", sans-serif;
        color: var(--component-text-accent);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .callout-text {
        font: 400 13px/20px "Inter", sans-serif;
        color: var(--component-text-secondary);
        line-height: 1.6;
      }

      /* Form Styles */
      .invite-form {
        background: rgba(31, 41, 55, 0.5);
        border: 1px solid var(--component-panel-border);
        border-radius: 12px;
        padding: 40px;
        margin-top: 40px;
        display: grid;
        gap: 20px;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        text-align: left;
      }
      
      [dir="rtl"] .form-group {
        text-align: right;
      }

      .form-group label {
        font: 600 13px/18px "Inter", sans-serif;
        color: var(--component-text-primary);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .form-group input, .form-group select {
        padding: 12px 16px;
        background: rgba(17, 24, 39, 0.8);
        border: 1px solid var(--component-panel-border);
        border-radius: 6px;
        color: var(--component-text-primary);
        font: 400 14px/20px "Inter", sans-serif;
        transition: all 0.2s ease;
      }

      .form-group input:focus, .form-group select:focus {
        outline: none;
        border-color: var(--component-text-accent);
        background: rgba(31, 41, 55, 0.9);
        box-shadow: 0 0 12px rgba(244, 187, 48, 0.2);
      }

      .button-primary {
        display: inline-block;
        padding: 14px 32px;
        background: var(--component-text-accent);
        color: var(--component-text-on-accent);
        border: none;
        border-radius: 6px;
        font: 600 16px/20px "Inter", sans-serif;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        width: 100%;
        text-align: center;
      }

      .button-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(244, 187, 48, 0.3);
      }

      @media (max-width: 1024px) {
        .section-grid, .three-panel-strip, .architecture-callouts {
          grid-template-columns: 1fr;
        }
        h1 { font-size: 40px; line-height: 48px; }
        h2 { font-size: 32px; line-height: 40px; }
        .hero-title { font-size: 40px; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="landing-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      <Hero content={t.hero} language={language} />

      <img id="background-image" src="/att/landing-screenshots/Vector.svg" alt="" />

      <div id="main-content">
        <NoNoise content={t.noNoise} />
        <Claims content={t.claims} />
        <Promise content={t.promise} />
        <Platform content={t.platform} />
        <Architecture content={t.architecture} language={language} />
        <BetaForm content={t.beta} language={language} />

        {/* FOOTER */}
        <footer style={{ padding: '40px', textAlign: 'center', color: 'var(--component-text-muted)', fontSize: '14px' }}>
          <p>{t.footer.rights}</p>
        </footer>
      </div>
    </div>
  );
}
