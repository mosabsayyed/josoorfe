import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';
import { useMainApp } from './MainAppContext';

export function useOnboardingTour() {
  const navigate = useNavigate();
  const { onboardingComplete, completeOnboarding, language } = useMainApp();

  const tourSteps = [
    {
      element: '#main-header',
      popover: {
        title: language === 'ar' ? 'مرحباً بك في جسور' : 'Welcome to Josoor',
        description: language === 'ar' 
          ? 'مرحباً بك في جسور، أنا نور. دعني أعرّفك على منطقة العمل حيث سنحقق أشياء عظيمة معاً (إن شاء الله). نبدأ بالرأسية، هذه الأدوات مهمة جداً.'
          : "Welcome to Josoor, I am Noor, let me familiarize you with the working area where we will do great things together (inshallah). Starting with the headers, these controls are very important.",
        position: 'bottom-center' as const,
      },
    },
    {
      element: '#sidebar-menu',
      popover: {
        title: language === 'ar' ? 'قائمة التنقل' : 'Navigation Menu',
        description: language === 'ar'
          ? 'هذه الأقسام ليست عشوائية، إنها مرشحات الضوضاء للتركيز على الإشارة في حلقة تأثير متكاملة.'
          : "These sections are not random, they are your Noise Filters to focus on the Signal in an Integrated Loop of Influence. It starts with the Sector, where Impact is Observed. The signal starts: What is the Ambition and Where does it materialize, and What Tools do we deploy. Enterprise: The signal continues, Which capabilities do we prioritize to hit our targets on time across People/Process/Tools? Controls: signal repeaters reminding us of actions to keep us aligned. Planning: signal boosters to keep our promises tangible. Reporting: Internal Signals on our efficiency in acting on commitments. And back to Sector to witness the impact then learn and improve.",
        position: 'right' as const,
      },
    },
    {
      element: '#sidebar-chat-section',
      popover: {
        title: language === 'ar' ? 'المحادثات' : 'Conversations',
        description: language === 'ar'
          ? 'ابدأ محادثات جديدة، أو طي الشريط الجانبي، أو الوصول إلى سجل المحادثات هنا.'
          : "Start new conversations, collapse the sidebar, or access your chat history here.",
        position: 'right' as const,
      },
    },
    {
      element: '#sector-desk-gauges',
      popover: {
        title: language === 'ar' ? 'مكتب القطاع' : 'Sector Desk',
        description: language === 'ar'
          ? 'انتبه للجائزة، هنا التأثير الذي نهدف إليه في النهاية!'
          : "Eyes on the prize, here is the impact we are ultimately aiming for!",
        position: 'top' as const,
      },
      onHighlightStarted: () => {
        navigate('/main/sector');
      },
    },
    {
      element: '#controls-desk-ribbons',
      popover: {
        title: language === 'ar' ? 'مكتب الرقابة' : 'Controls Desk',
        description: language === 'ar'
          ? 'إشارات انحراف فورية عن: الاتجاه، العوائق، التدفق والتكامل.'
          : "Instant Deviation Signals on: Direction, Obstacles, Flow and Integration.",
        position: 'top' as const,
      },
      onHighlightStarted: () => {
        navigate('/main/controls');
      },
    },
    {
      element: '#graph-explorer-3d',
      popover: {
        title: language === 'ar' ? 'مستكشف الرسم البياني' : 'Graph Explorer',
        description: language === 'ar'
          ? 'بينما فهمت دائماً تحولك، الآن يمكنك تصوره وتعقيداته.'
          : "While you always understood your transformation, now you can visualize it and its complexities.",
        position: 'center' as const,
      },
      onHighlightStarted: () => {
        navigate('/main/graph');
      },
    },
    {
      element: '#knowledge-series',
      popover: {
        title: language === 'ar' ? 'سلسلة المعرفة' : 'Knowledge Series',
        description: language === 'ar'
          ? 'سلسلة المعرفة: ابنِ فهماً أعمق للمفاهيم وطريقة تفاعلها.'
          : "Knowledge Series: Build a deeper understanding of the concepts and the way they interact.",
        position: 'right' as const,
      },
      onHighlightStarted: () => {
        navigate('/main/knowledge');
      },
    },
    {
      element: '#graph-chat',
      popover: {
        title: language === 'ar' ? 'محادثة الرسم البياني' : 'Graph Chat',
        description: language === 'ar'
          ? 'محادثة الرسم البياني: تحدث مع وكيل خبير مؤسس على رسم المعرفة.'
          : "Graph Chat: Talk to an expert agent grounded with the knowledge graph.",
        position: 'right' as const,
      },
      onHighlightStarted: () => {
        navigate('/main/chat');
      },
    },
    {
      element: '#header-profile',
      popover: {
        title: language === 'ar' ? 'ملفك الشخصي' : 'Your Profile',
        description: language === 'ar'
          ? 'قم بالوصول إلى ملفك الشخصي، وتغيير المظهر/اللغة، أو تسجيل الخروج. انقر على ? في أي وقت لإعادة هذه الجولة.'
          : "Access your profile, change theme/language, or logout. Click ? anytime to replay this tour.",
        position: 'bottom-left' as const,
      },
    },
  ];

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: tourSteps.map(step => ({
        element: step.element,
        popover: {
          title: step.popover.title,
          description: step.popover.description,
          side: step.popover.position as any,
        },
      })),
      onHighlightStarted: (element, step, options) => {
        const stepConfig = tourSteps[options.state.activeIndex || 0];
        if (stepConfig?.onHighlightStarted) {
          stepConfig.onHighlightStarted();
        }
      },
      onDestroyStarted: () => {
        completeOnboarding();
        driverObj.destroy();
      },
      popoverClass: 'josoor-driver-popover',
      overlayColor: 'rgba(0, 0, 0, 0.8)',
      stagePadding: 8,
      stageRadius: 8,
    });

    setTimeout(() => {
      driverObj.drive();
    }, 500);
  }, [navigate, language, completeOnboarding]);

  useEffect(() => {
    if (!onboardingComplete) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete, startTour]);

  return { startTour };
}

export default useOnboardingTour;
