import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/layout/Header';
import { Quote } from 'lucide-react';

export default function FounderLetterPage() {
  const { language, isRTL } = useLanguage();
  const { t } = useTranslation();

  const title = t('founderLetter.title');
  const paragraphs = t('founderLetter.paragraphs', { returnObjects: true }) as string[];
  const signature = t('founderLetter.signature');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111827',
      color: '#F9FAFB',
      paddingTop: '80px',
      overflowY: 'auto',
      height: '100vh'
    }}>
      <Header />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }} dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex',
              padding: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              borderRadius: '16px',
              marginBottom: '24px'
            }}>
              <Quote size={32} color="white" />
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '16px', fontFamily: isRTL ? '"Tajawal", sans-serif' : 'inherit' }}>{title}</h1>
          </div>

          <div style={{
            background: 'rgba(31, 41, 55, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '40px'
          }}>
            {paragraphs.map((paragraph, index) => {
              const isQuote = paragraph.startsWith('"');
              return (
                <p key={index} style={{
                  fontSize: isQuote ? '20px' : '16px',
                  lineHeight: '1.8',
                  marginBottom: '24px',
                  color: isQuote ? 'var(--component-text-accent)' : '#D1D5DB',
                  fontStyle: isQuote ? 'normal' : 'normal',
                  textAlign: isQuote ? 'center' : (isRTL ? 'right' : 'left'),
                  fontWeight: isQuote ? 500 : 400
                }}>
                  {paragraph}
                </p>
              );
            })}

            <div style={{
              marginTop: '48px',
              paddingTop: '32px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: isRTL ? 'left' : 'right'
            }}>
              <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--component-text-accent)' }}>{signature}</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
