"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const commands: Command[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      description: 'View admin dashboard',
      icon: 'dashboard',
      action: () => router.push('/admin'),
      keywords: ['home', 'overview'],
    },
    {
      id: 'issues',
      label: 'Manage Issues',
      description: 'View and edit wellbeing issues',
      icon: 'warning',
      action: () => router.push('/admin/issues'),
      keywords: ['wellbeing', 'topics'],
    },
    {
      id: 'events',
      label: 'Manage Events',
      description: 'View and edit events',
      icon: 'event',
      action: () => router.push('/admin/events'),
      keywords: ['calendar', 'schedule'],
    },
    {
      id: 'new-event',
      label: 'Create New Event',
      description: 'Add a new event',
      icon: 'add',
      action: () => router.push('/admin/events/new'),
      keywords: ['create', 'add'],
    },
    {
      id: 'schools',
      label: 'Manage Schools',
      description: 'View school profiles',
      icon: 'school',
      action: () => router.push('/admin/schools'),
      keywords: ['education', 'acara'],
    },
    {
      id: 'areas',
      label: 'Manage Areas',
      description: 'Edit areas and cities',
      icon: 'location_on',
      action: () => router.push('/admin/content'),
      keywords: ['cities', 'locations', 'geography'],
    },
    {
      id: 'blog',
      label: 'Manage Blog',
      description: 'View and edit blog posts',
      icon: 'article',
      action: () => router.push('/admin/blog'),
      keywords: ['posts', 'content', 'writing'],
    },
    {
      id: 'new-blog',
      label: 'Create New Blog Post',
      description: 'Write a new blog post',
      icon: 'add',
      action: () => router.push('/admin/blog/new'),
      keywords: ['write', 'create'],
    },
    {
      id: 'cms-pages',
      label: 'CMS Pages',
      description: 'Manage CMS pages',
      icon: 'pages',
      action: () => router.push('/admin/cms/pages'),
      keywords: ['content', 'pages'],
    },
    {
      id: 'menu',
      label: 'Navigation Menu',
      description: 'Edit site navigation',
      icon: 'menu',
      action: () => router.push('/admin/cms/menu'),
      keywords: ['navigation', 'links'],
    },
    {
      id: 'faq',
      label: 'Manage FAQs',
      description: 'Edit frequently asked questions',
      icon: 'help',
      action: () => router.push('/admin/faq'),
      keywords: ['questions', 'help'],
    },
    {
      id: 'partners',
      label: 'Manage Partners',
      description: 'Edit partner organizations',
      icon: 'handshake',
      action: () => router.push('/admin/partners'),
      keywords: ['organizations', 'sponsors'],
    },
    {
      id: 'home-page',
      label: 'Homepage Builder',
      description: 'Edit homepage content',
      icon: 'home',
      action: () => router.push('/admin/home-page'),
      keywords: ['landing', 'hero'],
    },
    {
      id: 'seo',
      label: 'SEO Manager',
      description: 'Manage SEO metadata',
      icon: 'travel_explore',
      action: () => router.push('/admin/seo'),
      keywords: ['search', 'metadata', 'optimization'],
    },
    {
      id: 'users',
      label: 'Manage Users',
      description: 'View and edit users',
      icon: 'people',
      action: () => router.push('/admin/users'),
      keywords: ['accounts', 'permissions'],
    },
  ], [router]);

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    
    const searchLower = search.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.includes(searchLower))
    );
  }, [search, commands]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+K or Ctrl+K to open
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
      setSearch('');
      setSelectedIndex(0);
    }

    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
      setSearch('');
      setSelectedIndex(0);
    }

    // Arrow navigation
    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      }
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      }
    }
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const executeCommand = (command: Command) => {
    command.action();
    setIsOpen(false);
    setSearch('');
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="command-palette-backdrop"
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Command Palette */}
      <div
        className="command-palette"
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '600px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {/* Search Input */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#9ca3af' }}>
              search
            </span>
            <input
              type="text"
              placeholder="Search commands... (Cmd+K)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              autoFocus
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                color: '#1e1040',
              }}
            />
            <kbd style={{
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
            }}>
              ESC
            </kbd>
          </div>
        </div>

        {/* Commands List */}
        <div
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: '12px' }}>
                search_off
              </span>
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: index === selectedIndex ? '#f3f4f6' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.1s',
                }}
              >
                {cmd.icon && (
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 20,
                      color: index === selectedIndex ? '#5925f4' : '#6b7280',
                    }}
                  >
                    {cmd.icon}
                  </span>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#1e1040', marginBottom: '2px' }}>
                    {cmd.label}
                  </div>
                  {cmd.description && (
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {cmd.description}
                    </div>
                  )}
                </div>
                {index === selectedIndex && (
                  <kbd style={{
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#6b7280',
                    backgroundColor: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                  }}>
                    ↵
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>{filteredCommands.length} commands</div>
        </div>
      </div>
    </>
  );
}
