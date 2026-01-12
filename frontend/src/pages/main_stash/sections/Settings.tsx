import React from 'react';
import { Settings as SettingsIcon, Database, Key, Bell, Users } from 'lucide-react';

const settingsSections = [
  { id: 'general', title: 'General', icon: SettingsIcon, description: 'Application preferences and defaults' },
  { id: 'database', title: 'Database', icon: Database, description: 'Connection and storage settings' },
  { id: 'api', title: 'API Keys', icon: Key, description: 'Provider configurations and keys' },
  { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Alert preferences and channels' },
  { id: 'team', title: 'Team', icon: Users, description: 'User management and permissions' },
];

export const Settings: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>
          Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          Platform Configuration
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {settingsSections.map(section => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              style={{
                backgroundColor: 'var(--component-panel-bg)',
                border: '1px solid var(--component-panel-border)',
                borderRadius: '8px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'var(--component-bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--color-gold)',
                }}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', margin: '0 0 4px 0', fontWeight: 600 }}>
                    {section.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                    {section.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
