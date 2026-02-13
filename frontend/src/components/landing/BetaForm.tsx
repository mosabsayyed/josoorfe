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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

      alert(language === 'en'
        ? 'Application submitted! We will review and contact you within 48 hours.'
        : 'تم تقديم الطلب! سنقوم بالمراجعة والتواصل معك خلال 48 ساعة.');

      setFormData({ name: '', email: '', organization: '', role: '' });

    } catch (err: any) {
      console.error('Registration error:', err);
      alert(language === 'en'
        ? 'Error submitting request. Please try again or contact support.'
        : 'خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.');
    }
  };

  return (
    <section className="content-centered" id="section-invite">
      <div className="section-content-box" style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: 'var(--component-panel-bg)',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '1px',
          marginBottom: '20px'
        }}>
          {content.tag}
        </div>
        <h2>{content.title}</h2>
        <p className="subtitle">{content.subtitle}</p>

        <form className="invite-form" onSubmit={handleSubmit} style={{ marginTop: '50px' }}>
          <div className="form-group">
            <label htmlFor="name">{content.form.name}</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="email">{content.form.email}</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="organization">{content.form.org}</label>
            <input type="text" id="organization" name="organization" value={formData.organization} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="role">{content.form.role}</label>
            <input type="text" id="role" name="role" value={formData.role} onChange={handleInputChange} required placeholder="e.g., VP Strategy, CTO, PMO Director" />
          </div>

          <button type="submit" className="button-primary" style={{ marginTop: '30px' }}>
            {content.form.submit}
          </button>
        </form>

        <p style={{
          marginTop: '30px',
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.5)',
          lineHeight: '1.6'
        }}>
          {content.note}
        </p>
      </div>
    </section>
  );
}
