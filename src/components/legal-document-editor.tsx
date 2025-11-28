'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { List, Hash } from 'lucide-react';

// Dynamically import ReactQuill to ensure it only runs on the client-side
const ReactQuill = dynamic(
    () => import('react-quill-new'), 
    { 
        ssr: false,
        loading: () => <Skeleton className="h-[400px] w-full rounded-md" />,
    }
);

interface LegalDocumentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function LegalDocumentEditor({ value, onChange, placeholder, className }: LegalDocumentEditorProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [showToc, setShowToc] = useState(true);
  const quillRef = useRef<any>(null);

  // Enhanced toolbar with more options
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['code-block'],
        ['clean']
      ],
    },
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent',
    'script',
    'color', 'background',
    'align',
    'link', 'image', 'video',
    'code-block'
  ];

  // Generate table of contents from headings
  useEffect(() => {
    if (!value) {
      setTocItems([]);
      return;
    }

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc: TocItem[] = [];
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent || '';
      // Generate a unique ID if not present
      let id = heading.id;
      if (!id) {
        id = `heading-${index}-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50)}`;
      }
      
      toc.push({ id, text, level });
    });

    setTocItems(toc);

    // Add IDs to headings in the editor DOM
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const editorHeadings = quill.root.querySelectorAll('h1, h2, h3, h4, h5, h6');
      editorHeadings.forEach((heading, index) => {
        if (!heading.id) {
          const text = heading.textContent || '';
          const id = `heading-${index}-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50)}`;
          heading.id = id;
        }
      });
    }
  }, [value]);

  // Scroll to heading when TOC item is clicked
  const scrollToHeading = (id: string) => {
    // First try to find in the editor
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const editorElement = quill.root;
      const headingElement = editorElement.querySelector(`#${id}`);
      if (headingElement) {
        headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Highlight the heading briefly
        headingElement.classList.add('highlight-heading');
        setTimeout(() => {
          headingElement.classList.remove('highlight-heading');
        }, 2000);
        return;
      }
    }
    
    // Fallback to document search
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle editor changes
  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className={cn("flex gap-4", className)}>
      {/* Table of Contents Sidebar */}
      {showToc && tocItems.length > 0 && (
        <Card className="w-64 flex-shrink-0 h-fit sticky top-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <List className="h-4 w-4" />
                Table of Contents
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToc(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px]">
              <nav className="space-y-1">
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={cn(
                      "block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      "text-muted-foreground hover:text-foreground",
                      item.level === 1 && "font-semibold text-foreground",
                      item.level === 2 && "ml-2",
                      item.level === 3 && "ml-4",
                      item.level === 4 && "ml-6",
                      item.level === 5 && "ml-8",
                      item.level === 6 && "ml-10"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {item.level > 1 && <Hash className="h-3 w-3 opacity-50" />}
                      {item.text}
                    </span>
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <div className={cn("flex-1", !showToc && "w-full")}>
        {!showToc && tocItems.length > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowToc(true)}
              className="text-xs"
            >
              <List className="h-3 w-3 mr-1" />
              Show Table of Contents ({tocItems.length} sections)
            </Button>
          </div>
        )}
        <div className="prose dark:prose-invert max-w-none">
          <style jsx global>{`
            .ql-toolbar {
              border-top-left-radius: var(--radius);
              border-top-right-radius: var(--radius);
              border-color: hsl(var(--border));
              background: hsl(var(--background));
              padding: 12px;
            }
            .ql-container {
              border-bottom-left-radius: var(--radius);
              border-bottom-right-radius: var(--radius);
              border-color: hsl(var(--border));
              min-height: 500px;
              background: hsl(var(--background));
            }
            .ql-editor {
              font-family: var(--font-sans);
              font-size: 15px;
              line-height: 1.7;
              min-height: 500px;
            }
            .ql-editor h1 {
              font-size: 2em;
              font-weight: 700;
              margin-top: 1.5em;
              margin-bottom: 0.75em;
              padding-bottom: 0.5em;
              border-bottom: 2px solid hsl(var(--border));
            }
            .ql-editor h2 {
              font-size: 1.5em;
              font-weight: 600;
              margin-top: 1.25em;
              margin-bottom: 0.5em;
            }
            .ql-editor h3 {
              font-size: 1.25em;
              font-weight: 600;
              margin-top: 1em;
              margin-bottom: 0.5em;
            }
            .ql-editor h4, .ql-editor h5, .ql-editor h6 {
              font-size: 1.1em;
              font-weight: 600;
              margin-top: 0.75em;
              margin-bottom: 0.5em;
            }
            .ql-editor p {
              margin-bottom: 1em;
            }
            .ql-editor ul, .ql-editor ol {
              margin-bottom: 1em;
              padding-left: 1.5em;
            }
            .ql-editor blockquote {
              border-left: 4px solid hsl(var(--primary));
              padding-left: 1em;
              margin-left: 0;
              margin-right: 0;
              font-style: italic;
              color: hsl(var(--muted-foreground));
            }
            .ql-editor code {
              background: hsl(var(--muted));
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 0.9em;
            }
            .ql-editor pre {
              background: hsl(var(--muted));
              padding: 1em;
              border-radius: var(--radius);
              overflow-x: auto;
              margin-bottom: 1em;
            }
            .ql-editor pre code {
              background: transparent;
              padding: 0;
            }
            .ql-editor h1[id], .ql-editor h2[id], .ql-editor h3[id],
            .ql-editor h4[id], .ql-editor h5[id], .ql-editor h6[id] {
              scroll-margin-top: 20px;
            }
            .ql-editor .highlight-heading {
              background-color: hsl(var(--primary) / 0.1);
              transition: background-color 0.3s ease;
            }
            .ql-snow .ql-stroke {
              stroke: hsl(var(--foreground));
            }
            .ql-snow .ql-fill {
              fill: hsl(var(--foreground));
            }
            .ql-snow .ql-picker-label {
              color: hsl(var(--foreground));
            }
            .ql-snow .ql-picker-options {
              background-color: hsl(var(--popover));
              border-color: hsl(var(--border));
            }
            .ql-snow .ql-picker-item:hover {
              background-color: hsl(var(--accent));
            }
            .ql-snow .ql-picker-item.ql-selected {
              background-color: hsl(var(--primary));
              color: hsl(var(--primary-foreground));
            }
            .ql-snow .ql-tooltip {
              background-color: hsl(var(--popover));
              border-color: hsl(var(--border));
              color: hsl(var(--foreground));
            }
            .ql-snow .ql-tooltip input {
              background-color: hsl(var(--background));
              border-color: hsl(var(--border));
              color: hsl(var(--foreground));
            }
          `}</style>
          {React.createElement(ReactQuill as any, {
            ref: quillRef,
            theme: "snow",
            value,
            onChange: handleEditorChange,
            modules,
            formats,
            placeholder: placeholder || "Start writing your legal document...",
          })}
        </div>
      </div>
    </div>
  );
}

