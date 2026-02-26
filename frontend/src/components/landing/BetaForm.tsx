import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { BetaFormContent } from './types';

interface BetaFormProps {
  content: BetaFormContent;
  language: string;
}

export default function BetaForm({ content, language }: BetaFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

      setIsSubmitted(true);
      setFormData({ name: '', email: '', organization: '', role: '' });

    } catch (err: any) {
      console.error('Registration error:', err);
      alert(t('beta.errorSubmit'));
    }
  };

  return (
    <section className="content-centered" id="beta">
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        {/* Tag */}
        <div className="section-tag" style={{ marginBottom: '6px' }}>
          {content.tag}
        </div>

        {/* Title */}
        <h2>{content.title}</h2>

        {/* Subtitle */}
        <p className="subtitle" style={{ maxWidth: '500px', marginBottom: '32px' }}>
          {content.subtitle}
        </p>

        {/* Form - matching v10 exactly */}
        <form
          className="bf"
          onSubmit={handleSubmit}
          style={{
            maxWidth: '460px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Row 1: Name + Email */}
          <div
            className="bf-r"
            style={{
              display: 'grid',
              gap: '10px'
            }}
          >
            <div>
              <label htmlFor="bf-name" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #808894)', marginBottom: '4px' }}>{content.form.name}</label>
              <input
                id="bf-name"
                type="text"
                name="name"
                placeholder={content.form.name}
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary, #111827)',
                  color: 'var(--text-primary, #f8f8f8)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--gold-muted, rgba(196, 149, 32, 1))'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
              />
            </div>
            <div>
              <label htmlFor="bf-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #808894)', marginBottom: '4px' }}>{content.form.email}</label>
              <input
                id="bf-email"
                type="email"
                name="email"
                placeholder={content.form.email}
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary, #111827)',
                  color: 'var(--text-primary, #f8f8f8)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--gold-muted, rgba(196, 149, 32, 1))'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
              />
            </div>
          </div>

          {/* Row 2: Organization + Role */}
          <div
            className="bf-r"
            style={{
              display: 'grid',
              gap: '10px'
            }}
          >
            <div>
              <label htmlFor="bf-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #808894)', marginBottom: '4px' }}>{content.form.org}</label>
              <input
                id="bf-org"
                type="text"
                name="organization"
                placeholder={content.form.org}
                value={formData.organization}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary, #111827)',
                  color: 'var(--text-primary, #f8f8f8)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--gold-muted, rgba(196, 149, 32, 1))'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
              />
            </div>
            <div>
              <label htmlFor="bf-role" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #808894)', marginBottom: '4px' }}>{content.form.role}</label>
              <select
                id="bf-role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                background: 'var(--bg-primary, #111827)',
                color: formData.role ? 'var(--text-primary, #f8f8f8)' : 'var(--text-muted, #808894)',
                fontFamily: 'inherit',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--gold-muted, rgba(196, 149, 32, 1))'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
            >
              <option value="" disabled>
                {content.form.role}
              </option>
              {content.form.roleOptions.map((option: string, i: number) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </select>
            </div>
          </div>

          {/* Submit Button - matching v10 exactly */}
          <button
            type="submit"
            disabled={isSubmitted}
            style={{
              padding: '13px 32px',
              border: `2px solid ${isSubmitted ? 'var(--success, #2DD4A8)' : 'var(--gold-primary, #F4BB30)'}`,
              borderRadius: '999px',
              background: 'transparent',
              color: isSubmitted ? 'var(--success, #2DD4A8)' : 'var(--gold-primary, #F4BB30)',
              fontSize: '16px',
              fontWeight: 700,
              cursor: isSubmitted ? 'default' : 'pointer',
              transition: 'all 0.25s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitted) {
                e.currentTarget.style.background = 'rgba(244, 187, 48, 0.10)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(244, 187, 48, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitted) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isSubmitted ? t('beta.submitSuccess') : content.form.submit}
          </button>
        </form>

        {/* Note */}
        <div style={{
          fontSize: '14px',
          color: 'var(--text-muted, #808894)',
          marginTop: '13px'
        }}>
          {content.note}
        </div>
      </div>
    </section>
  );
}
