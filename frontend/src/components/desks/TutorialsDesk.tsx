import { useState } from 'react';
import TwinKnowledge from '../content/TwinKnowledge';
import { TwinKnowledgeRenderer } from '../chat/renderers/TwinKnowledgeRenderer';
import type { TwinKnowledgeArtifact } from '../../types/api';
import './TutorialsDesk.css';

export function TutorialsDesk() {
    const [activeArticle, setActiveArticle] = useState<{ chapterId: string; episodeId: string } | null>(null);

    const handleNavigate = (chapterId: string, episodeId: string) => {
        setActiveArticle({ chapterId, episodeId });
    };

    const handleBack = () => {
        setActiveArticle(null);
    };

    // If article is selected, show TwinKnowledgeRenderer
    if (activeArticle) {
        const artifact: TwinKnowledgeArtifact = {
            artifact_type: 'TWIN_KNOWLEDGE',
            title: 'Twin Knowledge',
            content: {
                chapterId: activeArticle.chapterId,
                episodeId: activeArticle.episodeId
            }
        };

        return (
            <div className="tutorials-container">
                <TwinKnowledgeRenderer artifact={artifact} onBack={handleBack} />
            </div>
        );
    }

    // Otherwise show table of contents
    return (
        <div className="tutorials-container">
            <TwinKnowledge onNavigate={handleNavigate} />
        </div>
    );
}
