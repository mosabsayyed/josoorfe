import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { supabase } from '../lib/supabaseClient';

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

      const { data, error } = await supabase
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
        ? 'Error submitting request. Please try again.'
        : 'خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى.');
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
          ? 'Built with AIs for humans from the ground up — Every structure is machine-native. Every interface is human-intuitive.'
          : 'بني مع الذكاء الاصطناعي للبشر من الصفر - كل بنية أصلية للآلة. كل واجهة بديهية للإنسان.',
        language === 'en'
          ? 'Scalable to multi-Sectors and Entities — one Josoor instance adapts to any government entity without rebuilding.'
          : 'قابل للتوسع إلى قطاعات وكيانات متعددة - نسخة واحدة من جسور تتكيف مع أي كيان حكومي دون إعادة بناء.',
        language === 'en'
          ? "Tailored for the Vision and its objectives/KPIs — national methodologies and sectorial programs are first-class objects, not afterthoughts."
          : 'مصمم للرؤية وأهدافها/مؤشرات الأداء - المنهجيات الوطنية والبرامج القطاعية هي كائنات من الدرجة الأولى، وليست أفكاراً لاحقة.',
        language === 'en'
          ? 'Native Arabic (and soon multi-accent) — built for Arabic-first government context.'
          : 'عربي أصلي (وقريباً متعدد اللهجات) - مبني لسياق حكومي عربي أولاً.',
        language === 'en'
          ? 'One definition, one version, one source of Priorities — take opinions out of the dialogue. Everyone sees the same truth.'
          : 'تعريف واحد، إصدار واحد، مصدر واحد للأولويات - أخرج الآراء من الحوار. الجميع يرى نفس الحقيقة.',
        language === 'en'
          ? 'Frontier Knowledge Graphing to model complexity — relationships between KPIs, initiatives, risks, and resources are modelled as a living graph, not flat tables.'
          : 'رسم معرفي حدودي لنمذجة التعقيد - العلاقات بين مؤشرات الأداء والمبادرات والمخاطر والموارد منمذجة كرسم حي، وليس جداول مسطحة.',
        language === 'en'
          ? 'KSA Public-Sector\'s first "Ontology" IP — a reusable, scalable knowledge framework that grows smarter via guided AI learning.'
          : 'أول "أنطولوجيا" للقطاع العام السعودي - إطار معرفي قابل لإعادة الاستخدام والتوسع ينمو بذكاء عبر التعلم الموجه للذكاء الاصطناعي.'
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
            ? 'Not just what\'s red — catches what looks green but is quietly declining. Training drops, HR shrugs, Josoor traces the chain to the Minister\'s phone. You find out now, not in 3 months.'
            : 'ليس فقط ما هو أحمر - يلتقط ما يبدو أخضر لكنه يتراجع بهدوء. التدريب ينخفض، الموارد البشرية تتجاهل، جسور يتتبع السلسلة إلى هاتف الوزير. تكتشف الآن، وليس بعد 3 أشهر.'
        },
        {
          title: language === 'en' ? 'Decide' : 'قرر',
          desc: language === 'en'
            ? 'AI traces root cause and cascading impact across the map. The full chain from failing deliverable to national KPI, plus concrete options with outcomes. No guessing, all math.'
            : 'الذكاء الاصطناعي يتتبع السبب الجذري والتأثير المتتالي عبر الخريطة. السلسلة الكاملة من التسليم الفاشل إلى مؤشر الأداء الوطني، بالإضافة إلى خيارات ملموسة مع النتائج. لا تخمين، كل رياضيات.'
        },
        {
          title: language === 'en' ? 'Deliver' : 'نفذ',
          desc: language === 'en'
            ? 'Weekly priorities synced with Strategic Priorities. 4 out of 42 items matter this week — focus. True critical path drives system flags with high confidence'
            : 'الأولويات الأسبوعية متزامنة مع الأولويات الاستراتيجية. 4 من 42 عنصر مهم هذا الأسبوع - التركيز. المسار الحرج الحقيقي يقود علامات النظام بثقة عالية'
        }
      ]
    },
    architecture: {
      tag: language === 'en' ? 'The Architecture' : 'البنية',
      title: language === 'en' ? 'Designed around data you have today' : 'مصمم حول البيانات التي لديك اليوم',
      intro: language === 'en'
        ? 'No new data lake. No 18-month integration. Josoor is an overlay that builds bridges between your existing systems and stakeholders — a true information superhighway traversed by powerful LLMs, transforming data complexity into strategic insights and siloed stakeholders into an aligned powerhouse.'
        : 'لا بحيرة بيانات جديدة. لا تكامل لمدة 18 شهراً. جسور عبارة عن طبقة تبني جسور بين أنظمتك وأصحاب المصلحة الحاليين - طريق معلومات سريع حقيقي يسلكه LLMs قوية، محولة تعقيد البيانات إلى رؤى استراتيجية وأصحاب المصلحة المعزولين إلى قوة متماسكة.',
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
            ? 'For each capability under construction, checks every project closing its gaps. Calculates build exposure from real dates. No AI opinion — math.'
            : 'لكل قدرة قيد البناء، يتحقق من كل مشروع يغلق فجواته. يحسب التعرض للبناء من التواريخ الفعلية. لا رأي للذكاء الاصطناعي - رياضيات.'
        },
        {
          title: language === 'en' ? 'OPERATE — Are we running healthy?' : 'تشغيل - هل نعمل بصحة؟',
          desc: language === 'en'
            ? 'Scores people + process + tools. Two consecutive drops, even while green? Forced amber. Catches decline before red.'
            : 'يسجل الناس + العملية + الأدوات. انخفاضان متتاليان، حتى لو كان أخضر؟ عنبر قسري. يلتقط التراجع قبل الأحمر.'
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

  // Inject CSS
  useEffect(() => {
    const css = `
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');

      :root {
        /* Josoor Design System v2.0 */
        --bg-deep: #0B0F1A;
        --bg-primary: #111827;
        --bg-secondary: #1F2937;
        --bg-elevated: #283548;
        --bg-surface: #182230;
        --bg-overlay: rgba(17,24,39,0.88);

        --gold-primary: #F4BB30;
        --gold-bright: #FFD04A;
        --gold-hover: #E5AD20;
        --gold-muted: #C49520;
        --gold-faint: rgba(244,187,48,0.10);
        --gold-glow: rgba(244,187,48,0.25);
        --gold-grad: linear-gradient(135deg, #F4BB30, #FFD04A);

        --teal-primary: #145c80;
        --teal-light: #1a7aa8;
        --teal-muted: #0f4a66;
        --teal-faint: rgba(20,92,128,0.12);

        --text-primary: #f8f8f8;
        --text-secondary: #dcdcdc;
        --text-muted: #808894;
        --text-subtle: #545c68;
        --text-inverse: #111827;

        --success: #2DD4A8;
        --warning: #F4BB30;
        --error: #E8634B;
        --info: #5B9BD5;

        --border-default: rgba(255,255,255,0.06);
        --border-subtle: rgba(255,255,255,0.04);
        --border-strong: rgba(255,255,255,0.12);
        --border-gold: rgba(244,187,48,0.30);

        --font-primary: 'Inter', sans-serif;
        --font-heading: 'IBM Plex Sans', sans-serif;
        --font-mono: 'IBM Plex Mono', monospace;
        --font-arabic: 'IBM Plex Sans Arabic', sans-serif;

        --radius-md: 8px;
        --radius-lg: 12px;
        --radius-xl: 16px;
        --radius-2xl: 24px;

        --shadow-md: 0 4px 12px rgba(0,0,0,0.25);
        --shadow-lg: 0 8px 24px rgba(0,0,0,0.3);
        --shadow-xl: 0 16px 48px rgba(0,0,0,0.35);
        --shadow-gold: 0 0 20px rgba(244,187,48,0.15);
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        font-family: var(--font-primary);
        background: var(--bg-deep);
        color: var(--text-secondary);
        line-height: 1.7;
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
      }

      .landing-page {
        background: var(--bg-deep);
        color: var(--text-primary);
        overflow-x: hidden;
      }

      .container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 2rem;
      }

      section {
        padding: 6rem 0;
        position: relative;
      }

      .stag {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--gold-muted);
        margin-bottom: 0.8rem;
      }

      .stitle {
        font-family: var(--font-heading);
        font-size: clamp(30px, 3.8vw, 48px);
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1.15;
        letter-spacing: -0.02em;
        margin-bottom: 0.6rem;
      }

      .ssub {
        font-size: 16px;
        color: var(--text-muted);
        max-width: 560px;
        line-height: 1.65;
      }

      .ssub b {
        color: var(--text-primary);
        font-weight: 600;
      }

      /* HERO */
      .hero {
        min-height: 100vh;
        display: flex;
        align-items: center;
        padding-top: 4rem;
        position: relative;
        overflow: hidden;
      }

      .hero-video {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-width: 100%;
        min-height: 100%;
        width: auto;
        height: auto;
        object-fit: cover;
        z-index: 0;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        z-index: 1;
        background: radial-gradient(ellipse at center, transparent 0%, var(--bg-deep) 75%), linear-gradient(180deg, transparent 40%, var(--bg-deep) 100%);
      }

      .hero-center {
        text-align: center;
        max-width: 760px;
        margin: 0 auto;
        position: relative;
        z-index: 2;
      }

      .hero-center h1 {
        font-family: var(--font-heading);
        font-size: clamp(38px, 5vw, 61px);
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1.1;
        letter-spacing: -0.03em;
        margin-bottom: 1.5rem;
      }

      .hw {
        background: var(--gold-grad);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-brand {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        padding: 1.2rem 3rem;
        border: 2px solid var(--gold-primary);
        border-radius: var(--radius-xl);
        background: linear-gradient(135deg, rgba(244,187,48,0.06), rgba(244,187,48,0.01));
        box-shadow: 0 0 60px rgba(244,187,48,0.06);
        margin-top: 2rem;
      }

      .hb-name {
        font-family: var(--font-heading);
        font-size: 30px;
        font-weight: 800;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: var(--gold-bright);
      }

      .hb-tag {
        font-size: 14px;
        font-weight: 500;
        color: var(--gold-primary);
        letter-spacing: 0.03em;
      }

      /* NO NOISE */
      .nonoise {
        border-top: 1px solid var(--border-default);
      }

      .nonoise-inner {
        text-align: center;
        max-width: 800px;
        margin: 0 auto;
      }

      .hero-swagger {
        font-family: var(--font-heading);
        font-size: 26px;
        font-weight: 800;
        color: var(--text-primary);
        margin: 2rem 0;
      }

      /* CLAIMS */
      .claims {
        border-top: 1px solid var(--border-default);
      }

      .claims-head {
        text-align: center;
        margin-bottom: 2.5rem;
      }

      .claims-list {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .claim-item {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        padding: 1rem 1.2rem;
        background: var(--bg-primary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        transition: border-color 0.3s, background 0.3s;
      }

      .claim-item:hover {
        border-color: rgba(244,187,48,0.25);
        background: linear-gradient(135deg, rgba(244,187,48,0.03), transparent);
      }

      .claim-num {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 700;
        color: var(--gold-primary);
        min-width: 1.6rem;
        height: 1.6rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(244,187,48,0.25);
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 0.1rem;
      }

      .claim-text {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.55;
      }

      .claim-text b, .claim-text em {
        color: var(--text-primary);
        font-weight: 600;
        font-style: normal;
      }

      /* PERSONAS */
      .promise {
        border-top: 1px solid var(--border-default);
      }

      .persona-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
      }

      .persona-card {
        background: var(--bg-primary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
        transition: transform 0.3s, box-shadow 0.3s;
      }

      .persona-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      .persona-role {
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--gold-muted);
        letter-spacing: 0.06em;
        margin-bottom: 1rem;
      }

      .persona-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 1rem;
      }

      .persona-label.before {
        color: var(--error);
      }

      .persona-label.after {
        color: var(--success);
      }

      .persona-text {
        font-size: 13px;
        color: var(--text-muted);
        line-height: 1.45;
        margin: 0.5rem 0;
      }

      .persona-divider {
        height: 1px;
        background: var(--border-default);
        margin: 0.8rem 0;
      }

      /* PLATFORM MODES */
      .platform {
        border-top: 1px solid var(--border-default);
      }

      .mode-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
      }

      .mode-card {
        background: var(--bg-primary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
      }

      .mode-card h3 {
        font-family: var(--font-heading);
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary);
        margin-bottom: 1rem;
      }

      .mode-card p {
        font-size: 15px;
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .mode-card em {
        color: var(--gold-primary);
        font-style: normal;
        font-weight: 600;
      }

      /* ARCHITECTURE */
      .arch {
        border-top: 1px solid var(--border-default);
      }

      .arch-head {
        text-align: center;
        margin-bottom: 1rem;
      }

      .arch-intro {
        text-align: center;
        max-width: 650px;
        margin: 0 auto 2.5rem;
        font-size: 16px;
        color: var(--text-secondary);
        line-height: 1.65;
      }

      .arch-intro b {
        color: var(--text-primary);
      }

      .layer-stack {
        max-width: 500px;
        margin: 0 auto 2rem;
      }

      .layer {
        padding: 1rem 1.5rem;
        margin-bottom: 0.5rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        text-align: center;
      }

      .layer:first-child {
        background: linear-gradient(180deg, rgba(244,187,48,0.06), var(--bg-secondary));
      }

      .layer-name {
        font-family: var(--font-heading);
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .layer-desc {
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 0.3rem;
      }

      .engine-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        max-width: 800px;
        margin: 2rem auto;
      }

      .engine-card {
        background: var(--bg-primary);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
      }

      .engine-card h4 {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 0.8rem;
      }

      .engine-card.build h4 {
        color: var(--info);
      }

      .engine-card.operate h4 {
        color: var(--teal-light);
      }

      .engine-card p {
        font-size: 14px;
        color: var(--text-muted);
        line-height: 1.5;
      }

      .engine-card p b {
        color: var(--text-secondary);
      }

      /* BETA FORM */
      .beta {
        text-align: center;
        border-top: 1px solid var(--border-default);
        background: radial-gradient(ellipse at 50% 20%, rgba(244,187,48,0.04) 0%, transparent 55%);
      }

      .beta h2 {
        font-size: clamp(27px, 3.2vw, 38px);
        font-weight: 800;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .bsub {
        font-size: 15px;
        color: var(--text-muted);
        max-width: 500px;
        margin: 0 auto 2rem;
      }

      .bf {
        max-width: 460px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }

      .bf-r {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
      }

      @media(max-width: 500px) {
        .bf-r {
          grid-template-columns: 1fr;
        }
      }

      .bf input,
      .bf select,
      .bf textarea {
        width: 100%;
        padding: 0.7rem 0.9rem;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        background: var(--bg-primary);
        color: var(--text-primary);
        font-family: var(--font-primary);
        font-size: 14px;
        transition: border-color 0.2s;
        outline: none;
      }

      .bf input:focus,
      .bf select:focus,
      .bf textarea:focus {
        border-color: var(--gold-muted);
      }

      .bf input::placeholder,
      .bf textarea::placeholder {
        color: var(--text-muted);
      }

      .bf select {
        color: var(--text-muted);
        -webkit-appearance: none;
        cursor: pointer;
      }

      .bf textarea {
        resize: vertical;
        min-height: 72px;
      }

      .bf-submit {
        padding: 0.8rem 2rem;
        border: 2px solid var(--gold-primary);
        border-radius: 999px;
        background: transparent;
        color: var(--gold-primary);
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.25s;
        font-family: var(--font-primary);
      }

      .bf-submit:hover {
        background: var(--gold-faint);
        box-shadow: 0 0 30px rgba(244,187,48,0.12);
      }

      .bf-note {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 0.8rem;
      }

      footer {
        text-align: center;
        padding: 1.5rem;
        font-size: 11px;
        color: var(--text-muted);
        border-top: 1px solid var(--border-default);
      }

      footer span {
        color: var(--gold-muted);
      }

      @media (max-width: 768px) {
        .container {
          padding: 0 1rem;
        }

        section {
          padding: 4rem 0;
        }

        .persona-grid,
        .mode-grid {
          grid-template-columns: 1fr;
        }
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

      {/* HERO */}
      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="/att/josoor-hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-center">
            <h1>
              <span className="hw">{t.hero.title}</span>
              <br />
              {t.hero.subtitle}
            </h1>
            <div className="hero-brand">
              <div className="hb-name">{t.hero.badge}</div>
              <div className="hb-tag">(replace with josoor logo)</div>
            </div>
          </div>
        </div>
      </section>

      {/* NO NOISE - Simplified (no animation) */}
      <section className="nonoise">
        <div className="container">
          <div className="nonoise-inner">
            <div className="stitle">{t.noNoise.title}</div>
            <div className="ssub" style={{ margin: '0 auto 2.5rem' }}>
              <span className="hw">{t.noNoise.subtitle}</span>
            </div>
            <div className="hero-swagger">{t.noNoise.swagger}</div>
            <div className="hero-swagger">{t.noNoise.closing}</div>
          </div>
        </div>
      </section>

      {/* CLAIMS - TODO: User needs to tweak these */}
      <section className="claims">
        <div className="container">
          <div className="claims-head">
            <div className="stag">{t.claims.tag}</div>
            <div className="stitle">{t.claims.title}</div>
            <div className="ssub" style={{ margin: '0 auto' }}>{t.claims.subtitle}</div>
          </div>
          <div className="claims-list">
            {t.claims.items.map((item, i) => (
              <div className="claim-item" key={i}>
                <div className="claim-num">{i + 1}</div>
                <div className="claim-text" dangerouslySetInnerHTML={{ __html: item }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMISE - Personas */}
      <section className="promise">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="stag">{t.promise.tag}</div>
            <div className="stitle">{t.promise.title}</div>
            <div className="ssub" style={{ margin: '0 auto' }}>{t.promise.subtitle}</div>
          </div>
          <div className="persona-grid">
            {t.promise.personas.map((persona, i) => (
              <div className="persona-card" key={i}>
                <div className="persona-role">{persona.role}</div>
                <div className="persona-label before">{language === 'en' ? 'Before' : 'قبل'}</div>
                <div className="persona-text">{persona.before}</div>
                <div className="persona-divider"></div>
                <div className="persona-label after">{language === 'en' ? 'With Josoor' : 'مع جسور'}</div>
                <div className="persona-text">{persona.after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM - Three Modes */}
      <section className="platform">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="stag">{t.platform.tag}</div>
            <div className="stitle">{t.platform.title}</div>
            <div className="ssub" style={{ margin: '0 auto' }}>{t.platform.subtitle}</div>
          </div>
          <div className="mode-grid">
            {t.platform.modes.map((mode, i) => (
              <div className="mode-card" key={i}>
                <h3>{mode.title}</h3>
                <p dangerouslySetInnerHTML={{ __html: mode.desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="arch">
        <div className="container">
          <div className="arch-head">
            <div className="stag">{t.architecture.tag}</div>
            <div className="stitle">{t.architecture.title}</div>
          </div>
          <div className="arch-intro" dangerouslySetInnerHTML={{ __html: t.architecture.intro }} />

          <div className="layer-stack">
            {t.architecture.layers.map((layer, i) => (
              <div className="layer" key={i}>
                <div className="layer-name">{layer.name}</div>
                <div className="layer-desc">{layer.desc}</div>
              </div>
            ))}
          </div>

          <div className="engine-grid">
            {t.architecture.engines.map((engine, i) => (
              <div className={`engine-card ${i === 0 ? 'build' : 'operate'}`} key={i}>
                <h4>{engine.title}</h4>
                <p dangerouslySetInnerHTML={{ __html: engine.desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BETA FORM */}
      <section className="beta">
        <div className="container">
          <div className="stag">{t.beta.tag}</div>
          <h2>{t.beta.title}</h2>
          <p className="bsub">{t.beta.subtitle}</p>
          <form className="bf" onSubmit={handleSubmit}>
            <div className="bf-r">
              <input type="text" name="name" placeholder={t.beta.form.name} value={formData.name} onChange={handleInputChange} required />
              <input type="email" name="email" placeholder={t.beta.form.email} value={formData.email} onChange={handleInputChange} required />
            </div>
            <div className="bf-r">
              <input type="text" name="organization" placeholder={t.beta.form.org} value={formData.organization} onChange={handleInputChange} />
              <select name="role" value={formData.role} onChange={handleInputChange}>
                <option value="" disabled>{t.beta.form.role}</option>
                {t.beta.form.roleOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bf-submit">{t.beta.form.submit}</button>
          </form>
          <div className="bf-note">{t.beta.note}</div>
        </div>
      </section>

      <footer>
        <span>{t.footer.rights}</span>
      </footer>
    </div>
  );
}
