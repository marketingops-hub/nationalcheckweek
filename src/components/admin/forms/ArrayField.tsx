import React from 'react';
import { FormGroup } from './FormGroup';

interface ArrayFieldProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  addButtonText?: string;
}

export function ArrayField({ 
  label, 
  items, 
  onChange, 
  placeholder = 'Enter item',
  required, 
  helpText,
  addButtonText = 'Add Item'
}: ArrayFieldProps) {
  const handleAdd = () => {
    onChange([...items, '']);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  return (
    <FormGroup label={label} required={required} helpText={helpText}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={item}
              onChange={(e) => handleUpdate(index, e.target.value)}
              className="swa-input"
              placeholder={placeholder}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="swa-btn-secondary"
              style={{ 
                padding: '8px 16px',
                minWidth: 'auto',
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAdd}
          className="swa-btn-secondary"
          style={{ 
            padding: '10px 20px',
            background: '#29B8E8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            alignSelf: 'flex-start',
          }}
        >
          + {addButtonText}
        </button>
      </div>
    </FormGroup>
  );
}
