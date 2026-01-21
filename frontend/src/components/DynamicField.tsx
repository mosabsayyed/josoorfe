import React from 'react';
import './DynamicField.css';

interface DynamicFieldProps {
    label: string;
    value: any;
    onChange: (newValue: any) => void;
    readOnly?: boolean;
    fullWidth?: boolean;
}

export function DynamicField({ label, value, onChange, readOnly = false, fullWidth = false }: DynamicFieldProps) {
    const [jsonError, setJsonError] = React.useState<string | null>(null);

    const renderInput = () => {
        // Null or undefined
        if (value === null || value === undefined) {
            return (
                <input
                    type="text"
                    value=""
                    onChange={(e) => onChange(e.target.value || null)}
                    disabled={readOnly}
                    placeholder="null"
                    className="dynamic-input"
                />
            );
        }

        // Boolean → Checkbox
        if (typeof value === 'boolean') {
            return (
                <label className="dynamic-checkbox-wrapper">
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={readOnly}
                        className="dynamic-checkbox"
                    />
                    <span className="dynamic-checkbox-label">{value ? 'Enabled' : 'Disabled'}</span>
                </label>
            );
        }

        // Number → Number input
        if (typeof value === 'number') {
            return (
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={readOnly}
                    className="dynamic-input"
                />
            );
        }

        // String → Text input (or URL input for URLs)
        if (typeof value === 'string') {
            const isUrl = value.startsWith('http://') || value.startsWith('https://');
            if (value.length > 100 || value.includes('\n')) {
                // Long string or multiline → Textarea
                return (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={readOnly}
                        rows={4}
                        className="dynamic-textarea"
                    />
                );
            }
            return (
                <input
                    type={isUrl ? 'url' : 'text'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={readOnly}
                    className="dynamic-input"
                />
            );
        }

        // Array or Object → Collapsible JSON editor
        if (Array.isArray(value) || typeof value === 'object') {
            const [expanded, setExpanded] = React.useState(false);
            const jsonStr = JSON.stringify(value, null, 2);
            const preview = Array.isArray(value)
                ? `Array[${value.length}]`
                : `Object{${Object.keys(value).length} keys}`;

            return (
                <div className="json-field-wrapper">
                    <div className="json-preview" onClick={() => setExpanded(!expanded)}>
                        <span className="json-preview-icon">{expanded ? '▼' : '▶'}</span>
                        <span className="json-preview-text">{preview}</span>
                        <button
                            type="button"
                            className="json-expand-btn"
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        >
                            {expanded ? 'Collapse' : 'Expand'}
                        </button>
                    </div>

                    {expanded && (
                        <div className="json-editor-container">
                            <textarea
                                value={jsonStr}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        onChange(parsed);
                                        setJsonError(null);
                                    } catch (err: any) {
                                        setJsonError(err.message);
                                    }
                                }}
                                disabled={readOnly}
                                rows={Math.min(20, jsonStr.split('\n').length + 2)}
                                className="json-editor"
                                spellCheck={false}
                            />
                            {jsonError && (
                                <div className="json-error">Invalid JSON: {jsonError}</div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Fallback
        return <span className="dynamic-readonly">{String(value)}</span>;
    };

    return (
        <div className={`dynamic-field ${fullWidth ? 'full-width' : ''}`}>
            <label className="dynamic-label">
                <span className="field-name">{formatFieldName(label)}</span>
                {renderInput()}
            </label>
        </div>
    );
}

// Format field names nicely
function formatFieldName(field: string): string {
    // Remove s_ prefix from system settings
    if (field.startsWith('s_')) {
        field = field.substring(2);
    }

    // Convert snake_case to Title Case
    return field
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
