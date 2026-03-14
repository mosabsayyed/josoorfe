import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

type PublicPageId = 'landing' | 'founder-letter' | 'contact-us' | 'login';
type LanguageCode = 'en' | 'ar';

type PageMeta = {
  title: string;
  description: string;
  keywords: string[];
  subject: string;
  classification: string;
  ogType: 'website' | 'article';
};

const SITE_URL = 'https://www.aitwintech.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og_img.png`;
const BUSINESS_DNA_REFERENCE_URL = `${SITE_URL}/business-dna.html`;

const BUSINESS_DNA = {
  businessOverview:
    'Josoor is a Transformation Intelligence Operating System for Saudi government PMOs. It connects strategy, capabilities, projects, risks, and KPIs through a knowledge graph ontology — then uses governed AI to auto-collect data, surface risks early, and draft reports that used to take 30 hours. Built for Vision 2030 delivery.',
  brandValues: [
    'Transformation Intelligence',
    'Vision 2030 Aligned',
    'Public Sector Purpose-Built',
    'Superpowers, Not Dashboards',
    'Deterministic AI, Not Generic Chat',
  ],
  toneOfVoice: ['Direct', 'Bold', 'Empathetic', 'Expert-Insider'],
  brandAesthetic: ['Dark & Refined', 'Institutional Premium', 'Data-Forward', 'Geometric'],
  targetAudience: [
    'Vice Minister / Strategic Leadership',
    'PMO Director / Governance & Delivery',
    'Strategy Manager / Planning & Performance',
    'Business Manager / Capability Owner',
  ],
  audienceSummary:
    'Vice Ministers, PMO Directors, Strategy Heads, and capability owners in Saudi government entities responsible for Vision 2030 program delivery.',
  campaignPlatform: 'LinkedIn',
};

const PAGE_META: Record<PublicPageId, Record<LanguageCode, PageMeta>> = {
  landing: {
    en: {
      title: 'JOSOOR | Transformation Intelligence for Saudi Government PMOs',
      description:
        'Josoor is a Transformation Intelligence Operating System for Saudi government PMOs, connecting strategy, capabilities, projects, risks, and KPIs through a knowledge graph ontology and governed AI for Vision 2030 delivery.',
      keywords: [
        'JOSOOR',
        'Transformation Intelligence',
        'Saudi government PMO',
        'Vision 2030 delivery',
        'knowledge graph ontology',
        'governed AI',
        'public sector transformation',
        'strategic PMO platform',
        'government KPI reporting',
        'deterministic AI',
      ],
      subject: 'Transformation Intelligence Operating System for Saudi government PMOs',
      classification: 'Public sector transformation, Vision 2030 delivery, knowledge graph ontology, governed AI',
      ogType: 'website',
    },
    ar: {
      title: 'جسور | منصة التحول المعرفي لمكاتب إدارة المشاريع الحكومية في السعودية',
      description:
        'جسور نظام تشغيل للتحول المعرفي لمكاتب إدارة المشاريع الحكومية في المملكة، يربط الاستراتيجية والقدرات والمشاريع والمخاطر والمؤشرات عبر أنطولوجيا معرفية وذكاء اصطناعي محكوم لدعم تنفيذ رؤية 2030.',
      keywords: [
        'جسور',
        'التحول المعرفي',
        'مكتب إدارة المشاريع الحكومي',
        'رؤية 2030',
        'أنطولوجيا معرفية',
        'ذكاء اصطناعي محكوم',
        'التحول الحكومي',
        'التقارير التنفيذية',
        'المؤشرات والمخاطر',
      ],
      subject: 'نظام تشغيل للتحول المعرفي لمكاتب إدارة المشاريع الحكومية في السعودية',
      classification: 'التحول الحكومي، تنفيذ رؤية 2030، الأنطولوجيا المعرفية، الذكاء الاصطناعي المحكوم',
      ogType: 'website',
    },
  },
  'founder-letter': {
    en: {
      title: 'Founder Letter | Why Josoor Was Built This Way',
      description:
        'A founder letter explaining Josoor as a methodology for turning institutional complexity into navigable clarity by connecting objectives, policies, capabilities, projects, risks, and performance in one explorable context.',
      keywords: [
        'JOSOOR founder letter',
        'institutional intelligence',
        'knowledge graph methodology',
        'government transformation clarity',
        'Vision 2030 context',
      ],
      subject: 'Founder perspective on Josoor and institutional intelligence',
      classification: 'Founder letter, institutional intelligence, knowledge graph methodology',
      ogType: 'article',
    },
    ar: {
      title: 'رسالة المؤسس | لماذا بُنيت جسور بهذه الطريقة',
      description:
        'رسالة مؤسسية تشرح جسور كمنهج لتحويل التعقيد المؤسسي إلى وضوح قابل للاستكشاف عبر ربط الأهداف والسياسات والقدرات والمشاريع والمخاطر والأداء في سياق واحد.',
      keywords: ['رسالة المؤسس', 'جسور', 'الذكاء المؤسسي', 'الأنطولوجيا المعرفية', 'التحول الحكومي'],
      subject: 'رؤية المؤسس لمنهج جسور والذكاء المؤسسي',
      classification: 'رسالة مؤسس، ذكاء مؤسسي، منهج معرفي',
      ogType: 'article',
    },
  },
  'contact-us': {
    en: {
      title: 'Contact JOSOOR | Speak with AI Twin Tech',
      description:
        'Contact AI Twin Tech about Josoor, the Transformation Intelligence Operating System for Saudi government PMOs and Vision 2030 delivery teams.',
      keywords: ['Contact JOSOOR', 'AI Twin Tech contact', 'Saudi government PMO platform', 'Vision 2030 transformation contact'],
      subject: 'Contact page for JOSOOR and AI Twin Tech',
      classification: 'Contact page, public sector transformation platform, AI Twin Tech',
      ogType: 'website',
    },
    ar: {
      title: 'تواصل مع جسور | تواصل مع AI Twin Tech',
      description:
        'تواصل مع AI Twin Tech بخصوص جسور، نظام تشغيل التحول المعرفي لمكاتب إدارة المشاريع الحكومية وفرق تنفيذ رؤية 2030 في المملكة.',
      keywords: ['تواصل مع جسور', 'AI Twin Tech', 'مكتب إدارة المشاريع الحكومي', 'رؤية 2030'],
      subject: 'صفحة التواصل الخاصة بجسور و AI Twin Tech',
      classification: 'صفحة تواصل، منصة التحول الحكومي، AI Twin Tech',
      ogType: 'website',
    },
  },
  login: {
    en: {
      title: 'JOSOOR Login | Access the Transformation Intelligence Platform',
      description:
        'Access Josoor, the Transformation Intelligence platform built for Saudi public sector teams, governed AI workflows, and Vision 2030 delivery.',
      keywords: ['JOSOOR login', 'Transformation Intelligence platform', 'Saudi public sector login', 'Vision 2030 platform access'],
      subject: 'Login access for the JOSOOR Transformation Intelligence platform',
      classification: 'Login page, Transformation Intelligence platform, Saudi public sector',
      ogType: 'website',
    },
    ar: {
      title: 'تسجيل الدخول إلى جسور | الوصول إلى منصة التحول المعرفي',
      description:
        'الوصول إلى جسور، منصة التحول المعرفي المبنية لفرق القطاع العام السعودي وسير العمل المعتمد على ذكاء اصطناعي محكوم وتنفيذ رؤية 2030.',
      keywords: ['تسجيل الدخول إلى جسور', 'منصة التحول المعرفي', 'القطاع العام السعودي', 'رؤية 2030'],
      subject: 'صفحة الدخول إلى منصة جسور للتحول المعرفي',
      classification: 'صفحة دخول، منصة التحول المعرفي، القطاع العام السعودي',
      ogType: 'website',
    },
  },
};

function setMetaTag(selector: string, attributes: Record<string, string>, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => tag.setAttribute(key, value));
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setMetaName(name: string, content: string) {
  setMetaTag(`meta[name="${name}"]`, { name }, content);
}

function setMetaProperty(property: string, content: string) {
  setMetaTag(`meta[property="${property}"]`, { property }, content);
}

function setLink(rel: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(id: string, value: Record<string, unknown>) {
  let script = document.head.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-id', id);
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(value);
}

function resolveCanonicalPath(page: PublicPageId, pathname: string) {
  if (page === 'landing') {
    return pathname === '/' ? '/' : '/landing';
  }
  if (page === 'founder-letter') return '/founder-letter';
  if (page === 'contact-us') return '/contact-us';
  return '/login';
}

function absoluteUrl(path: string) {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

function buildRouteSchema(page: PublicPageId, meta: PageMeta, language: LanguageCode, canonicalUrl: string) {
  const base = {
    '@context': 'https://schema.org',
    inLanguage: language === 'ar' ? 'ar-SA' : 'en-SA',
    url: canonicalUrl,
    name: meta.title,
    description: meta.description,
    about: ['Transformation Intelligence', 'Saudi government PMOs', 'Vision 2030 delivery', 'Knowledge graph ontology', 'Governed AI'],
    isPartOf: {
      '@type': 'WebSite',
      name: 'JOSOOR',
      url: `${SITE_URL}/`,
    },
  };

  if (page === 'founder-letter') {
    return {
      ...base,
      '@type': 'Article',
      headline: meta.title,
      author: {
        '@type': 'Organization',
        name: 'AI Twin Tech',
      },
      publisher: {
        '@type': 'Organization',
        name: 'AI Twin Tech',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/icons/josoor.png`,
        },
      },
      mainEntityOfPage: canonicalUrl,
    };
  }

  if (page === 'contact-us') {
    return {
      ...base,
      '@type': 'ContactPage',
      mainEntity: {
        '@type': 'Organization',
        name: 'AI Twin Tech',
        email: 'info@aitwintech.com',
        url: `${SITE_URL}/`,
      },
    };
  }

  return {
    ...base,
    '@type': 'WebPage',
    mainEntityOfPage: canonicalUrl,
  };
}

export default function PublicPageMeta({ page }: { page: PublicPageId }) {
  const location = useLocation();
  const { language } = useLanguage();
  const lang: LanguageCode = language === 'ar' ? 'ar' : 'en';
  const meta = PAGE_META[page][lang];

  useEffect(() => {
    const canonicalUrl = absoluteUrl(resolveCanonicalPath(page, location.pathname));
    const locale = lang === 'ar' ? 'ar_SA' : 'en_US';

    document.title = meta.title;

    setMetaName('description', meta.description);
    setMetaName('keywords', meta.keywords.join(', '));
    setMetaName('subject', meta.subject);
    setMetaName('classification', meta.classification);
    setMetaName('category', 'Public Sector Technology, Strategic PMO, Government Transformation');
    setMetaName('coverage', 'Saudi Arabia');
    setMetaName('audience', BUSINESS_DNA.audienceSummary);
    setMetaName('target', BUSINESS_DNA.audienceSummary);
    setMetaName('language', lang === 'ar' ? 'Arabic' : 'English');
    setMetaName('business-overview', BUSINESS_DNA.businessOverview);
    setMetaName('brand-values', BUSINESS_DNA.brandValues.join(' | '));
    setMetaName('tone-of-voice', BUSINESS_DNA.toneOfVoice.join(' | '));
    setMetaName('brand-aesthetic', BUSINESS_DNA.brandAesthetic.join(' | '));
    setMetaName('target-audience', BUSINESS_DNA.targetAudience.join(' | '));
    setMetaName('campaign-platform', BUSINESS_DNA.campaignPlatform);
    setMetaName('business-dna-url', BUSINESS_DNA_REFERENCE_URL);

    setMetaProperty('og:type', meta.ogType);
    setMetaProperty('og:site_name', 'JOSOOR');
    setMetaProperty('og:locale', locale);
    setMetaProperty('og:locale:alternate', lang === 'ar' ? 'en_US' : 'ar_SA');
    setMetaProperty('og:title', meta.title);
    setMetaProperty('og:description', meta.description);
    setMetaProperty('og:url', canonicalUrl);
    setMetaProperty('og:image', DEFAULT_OG_IMAGE);

    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:title', meta.title);
    setMetaName('twitter:description', meta.description);
    setMetaName('twitter:image', DEFAULT_OG_IMAGE);

    setLink('canonical', canonicalUrl);
    setJsonLd('josoor-route-schema', buildRouteSchema(page, meta, lang, canonicalUrl));
  }, [lang, location.pathname, meta, page]);

  return null;
}