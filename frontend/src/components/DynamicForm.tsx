import React from 'react';
import { DynamicField } from './DynamicField';
import './DynamicForm.css';

interface DynamicFormProps {
    data: Record<string, any>;
    onChange: (key: string, value: any) => void;
    excludeFields?: string[];
    readOnlyFields?: string[];
    title?: string;
}

export function DynamicForm({
    data,
    onChange,
    excludeFields = [],
    readOnlyFields = [],
    title
}: DynamicFormProps) {
    if (!data) {
        return <p className="no-data">No data to display</p>;
    }

    const allFields = Object.entries(data).filter(([key]) => !excludeFields.includes(key));

    if (allFields.length === 0) {
        return <p className="no-data">No editable fields</p>;
    }

    // Group fields by type
    const primitiveFields: [string, any][] = [];
    const complexFields: [string, any][] = [];

    allFields.forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            complexFields.push([key, value]);
        } else {
            primitiveFields.push([key, value]);
        }
    });

    return (
        <div className="dynamic-form">
            {title && <h4 className="form-section-title">{title}</h4>}

            {/* Primitive fields in grid */}
            {primitiveFields.length > 0 && (
                <div className="fields-grid">
                    {primitiveFields.map(([key, value]) => (
                        <DynamicField
                            key={key}
                            label={key}
                            value={value}
                            onChange={(newValue) => onChange(key, newValue)}
                            readOnly={readOnlyFields.includes(key)}
                        />
                    ))}
                </div>
            )}

            {/* Complex fields full-width */}
            {complexFields.length > 0 && (
                <div className="complex-fields">
                    {complexFields.map(([key, value]) => (
                        <DynamicField
                            key={key}
                            label={key}
                            value={value}
                            onChange={(newValue) => onChange(key, newValue)}
                            readOnly={readOnlyFields.includes(key)}
                            fullWidth
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
