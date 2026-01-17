import React from 'react';
import { FrameHeader } from '../../pages/josoor-sandbox/layout/FrameHeader';
import { useLanguage } from '../../contexts/LanguageContext';

interface UnifiedHeaderProps {
    year: string;
    quarter: string;
    onYearChange: (y: string) => void;
    onQuarterChange: (q: string) => void;
    title: string;
    subtitle: string;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = (props) => {
    // Wrapper around FrameHeader to maintain consistent API
    // We can extend this later if specific modifications are needed
    // that diverge from the sandbox FrameHeader

    return (
        <div className="unified-header-wrapper" style={{ flexShrink: 0 }}>
            <FrameHeader
                {...props}
                onOnboardingReplay={() => window.dispatchEvent(new CustomEvent('start-onboarding'))}
            />
        </div>
    );
};
