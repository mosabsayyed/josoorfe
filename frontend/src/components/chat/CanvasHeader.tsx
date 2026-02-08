import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  ShareIcon,
  PrinterIcon,
  BookmarkIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

interface CanvasHeaderProps {
  title: string;
  onClose?: () => void;
  onZenToggle?: () => void;
  isZenMode?: boolean;
  onAction?: (action: 'share' | 'print' | 'save' | 'download') => void;
  hideClose?: boolean;
  onToggleComments?: () => void;
  showComments?: boolean;
  showLanguageToggle?: boolean;
}

export function CanvasHeader({ 
  title, 
  onClose, 
  onZenToggle, 
  isZenMode = false, 
  onAction,
  hideClose = false,
  onToggleComments,
  showComments = false,
  showLanguageToggle = false
}: CanvasHeaderProps) {
  const { language, setLanguage } = useLanguage();

  const translations = {
    share: language === 'ar' ? 'مشاركة' : 'Share',
    print: language === 'ar' ? 'طباعة' : 'Print',
    save: language === 'ar' ? 'حفظ' : 'Save',
    download: language === 'ar' ? 'تحميل' : 'Download',
    enterZenMode: language === 'ar' ? 'وضع التركيز' : 'Enter Zen Mode',
    exitZenMode: language === 'ar' ? 'خروج من وضع التركيز' : 'Exit Zen Mode',
    close: language === 'ar' ? 'إغلاق' : 'Close',
    comments: language === 'ar' ? 'التعليقات' : 'Comments',
  };

  return (
    <div className="canvas-header">
      <div className="canvas-header-title-section">
        <div className="canvas-header-accent-bar" />
        <h2 className="canvas-header-title" title={title}>
          {title}
        </h2>
      </div>

      <div className="canvas-header-actions">
        {/* Language Toggle */}
        {showLanguageToggle && (
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="header-button" style={{ padding: '0.375rem 0.75rem', transition: 'color 0.2s', fontSize: '0.875rem', fontWeight: 500 }}
            title={language === 'en' ? 'العربية' : 'English'}
          >
            {/* Show TARGET language (what you'd switch TO) */}
            {language === 'en' ? 'AR' : 'EN'}
          </button>
        )}

        {/* Comments Toggle */}
        {onToggleComments && (
          <button
            onClick={onToggleComments}
            className="header-button clickable" style={{ padding: '0.5rem', transition: 'color 0.2s, background-color 0.2s', backgroundColor: showComments ? '#FEF3C7' : 'transparent', color: showComments ? '#B45309' : 'inherit' }}
            title={translations.comments}
          >
            <ChatBubbleLeftRightIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        )}

        {onAction && (
          <>
            <button 
              onClick={() => onAction('share')}
              className="clickable header-button" style={{ padding: '0.5rem', transition: 'color 0.2s' }}
              title={translations.share}
            >
              <ShareIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <button 
              onClick={() => onAction('print')}
              className="clickable header-button" style={{ padding: '0.5rem', transition: 'color 0.2s' }}
              title={translations.print}
            >
              <PrinterIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <div style={{ width: 1, height: 24, backgroundColor: 'var(--component-panel-border)', margin: '0 4px' }} />
          </>

        )}

        {/* Zen Mode Toggle */}
        {onZenToggle && (
          <button
            onClick={onZenToggle}
            className="clickable header-button" style={{ padding: '0.5rem', transition: 'color 0.2s' }}
            title={isZenMode ? translations.exitZenMode : translations.enterZenMode}
          >
            {isZenMode ? (
              <ArrowsPointingInIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            ) : (
              <ArrowsPointingOutIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            )}
          </button>
        )}

        {/* Close Button */}
        {!hideClose && onClose && (
          <button
            onClick={onClose}
            className="clickable header-button"
            style={{ padding: '0.5rem', transition: 'color 0.2s, background-color 0.2s' }}
            title={translations.close}
          >
            <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        )}
      </div>
    </div>
  );
}
