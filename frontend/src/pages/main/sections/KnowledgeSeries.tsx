import React from 'react';
import { BookOpen, Video, Headphones, FileText } from 'lucide-react';

const mockContent = [
  { id: 'k1', title: 'Introduction to Cognitive Twins', type: 'article' as const, duration: '8 min read' },
  { id: 'k2', title: 'Enterprise Ontology Fundamentals', type: 'video' as const, duration: '15 min' },
  { id: 'k3', title: 'Risk Propagation Explained', type: 'audio' as const, duration: '12 min' },
  { id: 'k4', title: 'Capability Mapping Guide', type: 'guide' as const, duration: '20 min read' },
  { id: 'k5', title: 'Sector Transformation Patterns', type: 'video' as const, duration: '22 min' },
  { id: 'k6', title: 'Data-Driven Governance', type: 'article' as const, duration: '10 min read' },
];

export const KnowledgeSeries: React.FC = () => {
  const getIcon = (type: 'article' | 'video' | 'audio' | 'guide') => {
    switch (type) {
      case 'article': return <FileText size={20} />;
      case 'video': return <Video size={20} />;
      case 'audio': return <Headphones size={20} />;
      case 'guide': return <BookOpen size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return '#60A5FA';
      case 'video': return '#F472B6';
      case 'audio': return '#34D399';
      case 'guide': return '#FBBF24';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div id="knowledge-series" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>
          Knowledge Series
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          Build deeper understanding of concepts and their interactions
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {mockContent.map(item => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'var(--component-panel-bg)',
              border: '1px solid var(--component-panel-border)',
              borderRadius: '8px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                padding: '10px',
                backgroundColor: 'var(--component-bg-secondary)',
                borderRadius: '8px',
                color: getTypeColor(item.type),
              }}>
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', margin: '0 0 6px 0', fontWeight: 600 }}>
                  {item.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    color: getTypeColor(item.type),
                    fontWeight: 600,
                  }}>
                    {item.type}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    {item.duration}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeSeries;
