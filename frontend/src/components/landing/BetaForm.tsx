import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BetaFormContent } from './types';

interface BetaFormProps {
  content: BetaFormContent;
  language: string;
}

export default function BetaForm({ content, language }: BetaFormProps) {
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
      alert(language === 'en'
        ? 'Error submitting request. Please try again or contact support.'
        : 'خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.');
    }
  };

  return (
    <section className="content-centered" id="beta">
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        {/* Tag */}
        <div style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '14px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--gold-muted, rgba(196, 149, 32, 1))',
          marginBottom: '6px'
        }}>
          {content.tag}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 48px)',
          fontWeight: 800,
          marginBottom: '10px',
          fontFamily: 'var(--font-heading, "Inter")',
          color: 'var(--text-primary, #f8f8f8)'
        }}>
          {content.title}
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: '15px',
          color: 'var(--text-muted, #808894)',
          maxWidth: '500px',
          margin: '0 auto 32px',
          lineHeight: '1.65'
        }}>
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
            <input
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
                fontFamily: 'var(--font-primary, Inter)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--gold-muted, rgba(196, 149, 32, 1))'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
            />
            <input
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
                fontFamily: 'var(--font-primary, Inter)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--gold-muted, rgba(196, 149, 32, 1))'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
            />
          </div>

          {/* Row 2: Organization + Role */}
          <div
            className="bf-r"
            style={{
              display: 'grid',
              gap: '10px'
            }}
          >
            <input
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
                fontFamily: 'var(--font-primary, Inter)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--gold-muted, rgba(196, 149, 32, 1))'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
            />
            <select
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
                fontFamily: 'var(--font-primary, Inter)',
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
              fontSize: '15px',
              fontWeight: 700,
              cursor: isSubmitted ? 'default' : 'pointer',
              transition: 'all 0.25s',
              fontFamily: 'var(--font-primary, Inter)'
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
            {isSubmitted ? 'Application submitted' : content.form.submit}
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
