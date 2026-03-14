import re
file_path = 'frontend/src/components/landing/DesktopExperience.tsx'
with open(file_path, 'r') as f:
    text = f.read()

# 1. Add isPortrait to state
state_block = r"const \[isMobile, setIsMobile\] = useState\(false\);"
new_state_block = """const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);"""
text = re.sub(state_block, new_state_block, text)

# 2. Update the resize listener
check_block = r"""const check = \(\) => setIsMobile\(window\.innerWidth <= 768\);
    check\(\);"""
new_check_block = """const check = () => {
      setIsMobile(window.innerWidth <= 1024);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    check();"""
text = re.sub(check_block, new_check_block, text)

# 3. Add the rotation overlay at the top of the return payload
return_block = r"(<div\s+ref=\{containerRef\}\s+style=\{\{\s+width: '100%',\s+height: '100%',\s+position: 'relative',[^}]+\}\}\s+>)"

overlay_code = """\\1
        {/* Rotate Device Overlay */}
        {isMobile && isPortrait && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 9999,
            background: 'rgba(10,10,26,0.95)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#fff', textAlign: 'center', padding: 20
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, animation: 'rotateIcon 2s infinite ease-in-out' }}>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <style>{`
              @keyframes rotateIcon {
                0% { transform: rotate(0deg); }
                50% { transform: rotate(-90deg); }
                100% { transform: rotate(-90deg); }
              }
            `}</style>
            <h3 style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>
              {isRTL ? 'يُرجى تدوير جهازك' : 'Please rotate your device'}
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 280 }}>
              {isRTL 
                ? 'للحصول على أفضل تجربة تفاعلية للجولة، يُرجى استخدام الوضع الأفقي.'
                : 'For the best interactive tour experience, please turn your device to landscape.'}
            </p>
          </div>
        )}
"""

text = re.sub(return_block, overlay_code, text)

with open(file_path, 'w') as f:
    f.write(text)
print("Tour overlay injected.")
