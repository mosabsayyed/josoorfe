import re

with open('frontend/src/components/landing/SolutionBlocks.tsx', 'r') as f:
    text = f.read()

# Add CSS
text = text.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from 'react-i18next';\nimport './SolutionBlocks.css';")

# StatAccent
text = re.sub(
    r"function StatAccent\(\{ value, label, isMobile \}: \{ value: string; label: string; isMobile: boolean \}\) \{[\s\S]*?return \([\s\S]*?<div style=\{\{[\s\S]*?\}\}>([\s\S]*?)<span style=\{\{[\s\S]*?\}\}>([\s\S]*?)</span>([\s\S]*?)<span style=\{\{[\s\S]*?\}\}>([\s\S]*?)</span>([\s\S]*?)</div>\n  \);\n\}",
    r"""function StatAccent({ value, label }: { value: string; label: string }) {
  return (
    <div className="sb-stat-accent">
      <span className="sb-stat-value">
        {value}
      </span>
      <span className="sb-stat-label">
        {label}
      </span>
    </div>
  );
}""",
    text
)

# ListAccent
text = re.sub(
    r"function ListAccent\(\{ items, isMobile \}: \{ items: Array<\{ bold: string; text: string \}>; isMobile: boolean \}\) \{[\s\S]*?return \([\s\S]*?<div style=\{\{[\s\S]*?\}\}>([\s\S]*?)\{items\.map\(\(item, i\) => \([\s\S]*?<div key=\{i\} style=\{\{[\s\S]*?\}\}>([\s\S]*?)<div style=\{\{[\s\S]*?\}\}>[\s\S]*?<svg width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www\.w3\.org/2000/svg\">[\s\S]*?<path d=\"M2 6L5 9L10 3\" stroke=\"#F4BB30\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"/>[\s\S]*?</svg>[\s\S]*?</div>([\s\S]*?)<div style=\{\{[\s\S]*?\}\}>([\s\S]*?)<strong style=\{\{[\s\S]*?\}\}>([\s\S]*?)\{item\.bold\}[\s\S]*?</strong>\{' '\}[\s\S]*?<span style=\{\{[\s\S]*?\}\}>([\s\S]*?)\{item\.text\}[\s\S]*?</span>([\s\S]*?)</div>([\s\S]*?)</div>[\s\S]*?\)\}([\s\S]*?)</div>\n  \);\n\}",
    r"""function ListAccent({ items }: { items: Array<{ bold: string; text: string }> }) {
  return (
    <div className="sb-list-accent">
      {items.map((item, i) => (
        <div key={i} className="sb-list-item">
          <div className="sb-list-icon">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6L5 9L10 3" stroke="#F4BB30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <strong className="sb-list-text-bold">
              {item.bold}
            </strong>{' '}
            <span className="sb-list-text">
              {item.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}""",
    text
)

# QuoteAccent
text = re.sub(
    r"function QuoteAccent\(\{ text, isMobile \}: \{ text: string; isMobile: boolean \}\) \{[\s\S]*?return \([\s\S]*?<div style=\{\{[\s\S]*?\}\}>([\s\S]*?)<p style=\{\{[\s\S]*?\}\}>([\s\S]*?)\"\{text\}\"[\s\S]*?</p>([\s\S]*?)</div>\n  \);\n\}",
    r"""function QuoteAccent({ text }: { text: string }) {
  return (
    <div className="sb-quote-accent">
      <p className="sb-quote-text">
        "{text}"
      </p>
    </div>
  );
}""",
    text
)


# BlockCard
text = text.replace(',\n  isMobile,', ',')
text = text.replace(',\n  isMobile: boolean;', ',')

text = re.sub(
    r"      style=\{\{[\s\S]*?\}\}",
    r"""      className={`sb-card ${isVisible ? 'visible' : ''}`}""",
    text
)
text = text.replace("style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}", "")

text = re.sub(
    r"      {/\* Row: question \+ accent \*/} \s*<div style={{[\s\S]*?}}>",
    r"      {/* Row: question + accent */}\n      <div className=\"sb-card-content\">",
    text
)

text = re.sub(
    r"        {/\* Main: number \+ question \+ answer \*/} \s*<div style={{[\s\S]*?}}>",
    r"        {/* Main: number + question + answer */}\n        <div className=\"sb-card-left\">",
    text
)

text = re.sub(
    r"          <span style={{[\s\S]*?}}>",
    r"          <span className=\"sb-card-badge\">",
    text
)
text = re.sub(
    r"          <h3 style={{[\s\S]*?}}>",
    r"          <h3 className=\"sb-card-title\">",
    text
)
text = re.sub(
    r"          <p style={{[\s\S]*?}}>",
    r"          <p className=\"sb-card-desc\">",
    text
)

text = re.sub(
    r"        {/\* Accent panel \*/} \s*<div style={{[\s\S]*?}}>",
    r"        {/* Accent panel */}\n        <div className=\"sb-card-right\">",
    text
)

text = text.replace("isMobile={isMobile}", "")

# Main Component
text = re.sub(r'  const \[isMobile, setIsMobile\] = useState\(false\);\n', '', text)
text = re.sub(r'  useEffect\(\(\) => \{\n    const check = \(\) => setIsMobile\(window\.innerWidth <= 768\);\n    check\(\);\n    window\.addEventListener\(\'resize\', check\);\n    return \(\) => window\.removeEventListener\(\'resize\', check\);\n  \}, \[\]\);\n', '', text)

text = re.sub(
    r"          <div style={{ textAlign: 'center', marginBottom: isMobile \? '1\.5rem' : '2\.5rem' }}>",
    r"          <div className=\"sb-header\">",
    text
)

text = re.sub(
    r"          <div style={{[\s\S]*?flexDirection: 'column',[\s\S]*?}}>",
    r"          <div className=\"sb-container\">",
    text
)

with open('frontend/src/components/landing/SolutionBlocks.tsx', 'w') as f:
    f.write(text)
