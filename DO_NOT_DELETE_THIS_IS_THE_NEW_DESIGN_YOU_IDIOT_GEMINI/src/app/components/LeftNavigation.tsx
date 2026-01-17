import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  FileText,
  BookOpen,
  MapPin,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  Droplets,
  GitFork,
  MessageSquare
} from 'lucide-react';
import './LeftNavigation.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface LeftNavigationProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
}

const navSections: NavSection[] = [
  {
    title: 'EXECUTIVE',
    items: [
      { id: 'sector-desk', label: 'Sector Desk', icon: LayoutDashboard },
      { id: 'enterprise-desk', label: 'Enterprise Desk', icon: Building2 },
      { id: 'controls-desk', label: 'Controls Desk', icon: GitFork },
      { id: 'planning-desk', label: 'Planning Desk', icon: ClipboardList },
      { id: 'reporting-desk', label: 'Reporting Desk', icon: FileText },
    ],
  },
  {
    title: 'REFERENCES',
    items: [
      { id: 'knowledge-series', label: 'Knowledge Series', icon: BookOpen },
      { id: 'graph-chat', label: 'Graph Chat', icon: MessageSquare },
      { id: 'roadmap', label: 'Roadmap', icon: MapPin },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'observability', label: 'Observability', icon: Activity },
    ],
  },
];

export function LeftNavigation({ activeView, onNavigate }: LeftNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavigate = (itemId: string) => {
    onNavigate(itemId);
  };

  return (
    <div
      className={`left-nav-container ${isCollapsed ? 'collapsed' : 'expanded'
        }`}
    >
      {/* Header */}
      <div className="left-nav-header">
        {!isCollapsed && (
          <div className="left-nav-header-content">
            <div className="left-nav-logo">
              <Droplets className="left-nav-logo-icon" />
            </div>
            <div>
              <h1 className="left-nav-title">Sector Ops - Water - KSA</h1>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="left-nav-logo centered">
            <Droplets className="left-nav-logo-icon" />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="left-nav-nav">
        {navSections.map((section) => (
          <div key={section.title} className="left-nav-section">
            {!isCollapsed && (
              <div className="left-nav-section-title-container">
                <h2 className="left-nav-section-title">
                  {section.title}
                </h2>
              </div>
            )}
            {isCollapsed && (
              <div className="left-nav-divider-container">
                <div className="left-nav-divider" />
              </div>
            )}
            <ul className="left-nav-list">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <li key={item.id} className="left-nav-item">
                    <button
                      onClick={() => handleNavigate(item.id)}
                      className={`left-nav-button ${isActive ? 'active' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`left-nav-icon ${isActive ? 'active' : ''}`} />
                      {!isCollapsed && (
                        <span className="left-nav-label">{item.label}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="left-nav-active-indicator" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer - Collapse Toggle */}
      <div className="left-nav-footer">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="left-nav-collapse-btn"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <ChevronRight className="left-nav-collapse-icon" />
          ) : (
            <>
              <ChevronLeft className="left-nav-collapse-icon" />
              <span className="left-nav-collapse-text">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}