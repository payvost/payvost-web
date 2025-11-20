
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

// Dynamically import ReactQuill to ensure it only runs on the client-side
const ReactQuill = dynamic(
    () => import('react-quill-new'), 
    { 
        ssr: false,
        loading: () => <Skeleton className="h-[200px] w-full rounded-md" />,
    }
);


interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'link'
];

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  return (
    <div className={cn("prose dark:prose-invert max-w-none", className)}>
      <style jsx global>{`
        .ql-toolbar {
          border-top-left-radius: var(--radius);
          border-top-right-radius: var(--radius);
          border-color: hsl(var(--border));
        }
        .ql-container {
          border-bottom-left-radius: var(--radius);
          border-bottom-right-radius: var(--radius);
          border-color: hsl(var(--border));
          min-height: 200px;
        }
        .ql-editor {
          font-family: var(--font-sans);
          font-size: 14px;
        }
        .ql-snow .ql-stroke {
            stroke: hsl(var(--foreground));
        }
         .ql-snow .ql-picker-label {
            color: hsl(var(--foreground));
        }
        .ql-snow .ql-picker-options {
            background-color: hsl(var(--popover));
            border-color: hsl(var(--border));
        }
      `}</style>
      {React.createElement(ReactQuill as any, {
        theme: "snow",
        value,
        onChange,
        modules,
        formats,
        placeholder,
      })}
    </div>
  );
}
