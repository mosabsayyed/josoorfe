import { useCallback, useRef } from 'react';
import { driver, DriveStep } from 'driver.js';
import { useNavigate } from 'react-router-dom';
import { useMainApp } from './MainAppContext';

const waitForElement = (selector: string, timeout = 2000): Promise<Element | null> => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
};

const ONBOARDING_STEPS: DriveStep[] = [
  {
    element: '#main-header',
    popover: {
      title: 'Welcome to JOSOOR',
      description: 'Welcome to Josoor, I am Noor, let me familiarize you with the working area where we will do great things together (inshallah). Starting with the headers, these controls are very important.',
      side: 'bottom',
      align: 'center',
    }
  },
  {
    element: '#sidebar-menu',
    popover: {
      title: 'Navigation Menu',
      description: 'These sections are not random, they are your Noise Filters to focus on the Signal in an Integrated Loop of Influence. It starts with the Sector, where Impact is Observed. The signal starts: What is the Ambition and Where does it materialize, and What Tools do we deploy.',
      side: 'right',
      align: 'start',
    }
  },
  {
    element: '#sidebar-chat-section',
    popover: {
      title: 'Chat & Conversations',
      description: 'Start new conversations, collapse the sidebar, or access your chat history here.',
      side: 'right',
      align: 'start',
    }
  },
  {
    element: '#sector-desk-gauges',
    popover: {
      title: 'Sector Desk',
      description: 'Eyes on the prize, here is the impact we are ultimately aiming for!',
      side: 'top',
      align: 'center',
    }
  },
  {
    element: '#controls-desk-ribbons',
    popover: {
      title: 'Controls Desk',
      description: 'Instant Deviation Signals on: Direction, Obstacles, Flow and Integration.',
      side: 'top',
      align: 'center',
    }
  },
  {
    element: '#graph-explorer-3d',
    popover: {
      title: 'Graph Explorer',
      description: 'While you always understood your transformation, now you can visualize it and its complexities.',
      side: 'left',
      align: 'center',
    }
  },
  {
    element: '#knowledge-series',
    popover: {
      title: 'Knowledge Series',
      description: 'Knowledge Series: Build a deeper understanding of the concepts and the way they interact.',
      side: 'right',
      align: 'center',
    }
  },
  {
    element: '#graph-chat',
    popover: {
      title: 'Graph Chat',
      description: 'Graph Chat: Talk to an expert agent grounded with the knowledge graph.',
      side: 'right',
      align: 'center',
    }
  },
  {
    element: '#header-profile',
    popover: {
      title: 'Your Profile',
      description: 'Access your profile, change theme/language, or logout. Click ? anytime to replay this tour.',
      side: 'bottom',
      align: 'end',
    }
  },
];

export function useOnboardingTour() {
  const navigate = useNavigate();
  const { completeOnboarding } = useMainApp();
  const isNavigatingRef = useRef(false);

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      steps: ONBOARDING_STEPS,
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      doneBtnText: 'Done',
      overlayColor: 'rgba(0, 0, 0, 0.8)',
      popoverClass: 'josoor-popover',
      onHighlightStarted: async (element, step, options) => {
        const stepIndex = ONBOARDING_STEPS.findIndex(s => s.element === step.element);
        const navMap: Record<number, string> = {
          3: '/main/sector',
          4: '/main/controls',
          5: '/main/graph',
          6: '/main/knowledge',
          7: '/main/chat',
        };
        
        if (navMap[stepIndex] && !isNavigatingRef.current) {
          isNavigatingRef.current = true;
          navigate(navMap[stepIndex]);
          
          const selector = step.element as string;
          if (selector) {
            await waitForElement(selector);
          }
          isNavigatingRef.current = false;
        }
      },
      onDestroyStarted: () => {
        completeOnboarding();
      },
      onDestroyed: () => {
        completeOnboarding();
      }
    });
    
    driverObj.drive();
  }, [navigate, completeOnboarding]);

  return { startTour };
}

export default useOnboardingTour;
