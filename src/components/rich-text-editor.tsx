'use client';

import React, { useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
  enableImageUpload?: boolean;
  imageUploadHandler?: (file: File) => Promise<string>;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  className,
  enableImageUpload = true,
  imageUploadHandler
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null);
  const { toast } = useToast();

  // Image upload handler
  const imageHandler = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          variant: 'destructive',
        });
        return;
      }

      try {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        const range = quill.getSelection(true);
        
        // Show loading state
        quill.insertText(range.index, 'Uploading image...', 'user');
        quill.setSelection(range.index + 20);

        let imageUrl: string;
        
        if (imageUploadHandler) {
          // Use custom upload handler
          imageUrl = await imageUploadHandler(file);
        } else {
          // Default: upload to API
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/content/upload-image', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload image');
          }

          const data = await response.json();
          imageUrl = data.url;
        }

        // Remove loading text and insert image
        quill.deleteText(range.index, 20);
        quill.insertEmbed(range.index, 'image', imageUrl, 'user');
        quill.setSelection(range.index + 1);

        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        });
      } catch (error: any) {
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.deleteText(range.index, 20);
        }
        toast({
          title: 'Upload failed',
          description: error.message || 'Failed to upload image',
          variant: 'destructive',
        });
      }
    };
  };

  // Video embed handler
  const videoHandler = () => {
    const url = prompt('Enter video URL (YouTube, Vimeo, or direct video link):');
    if (!url) return;

    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection(true);
    
    // Convert YouTube/Vimeo URLs to embed format
    let embedUrl = url;
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
    }
    
    quill.insertEmbed(range.index, 'video', embedUrl, 'user');
  };

  // Enhanced toolbar configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }, { 'align': [] }],
        ['link', 'image', 'video'],
        ['code-block', 'code'],
        ['clean']
      ],
      handlers: {
        image: enableImageUpload ? imageHandler : undefined,
        video: videoHandler,
      }
    },
    clipboard: {
      matchVisual: false,
    },
  }), [enableImageUpload]);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background',
    'script',
    'list', 'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'code-block', 'code'
  ];

  return (
    <div className={cn("prose dark:prose-invert max-w-none", className)}>
      <style jsx global>{`
        .ql-toolbar {
          border-top-left-radius: var(--radius);
          border-top-right-radius: var(--radius);
          border-color: hsl(var(--border));
          background: hsl(var(--background));
        }
        .ql-container {
          border-bottom-left-radius: var(--radius);
          border-bottom-right-radius: var(--radius);
          border-color: hsl(var(--border));
          min-height: 300px;
          background: hsl(var(--background));
        }
        .ql-editor {
          font-family: var(--font-sans);
          font-size: 14px;
          min-height: 300px;
        }
        .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
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
          color: hsl(var(--foreground));
        }
        .ql-snow .ql-picker-item {
          color: hsl(var(--foreground));
        }
        .ql-snow .ql-picker-item:hover {
          background-color: hsl(var(--accent));
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
        .ql-snow .ql-tooltip a {
          color: hsl(var(--primary));
        }
        .ql-snow .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius);
          margin: 1rem 0;
        }
        .ql-snow .ql-editor pre.ql-syntax {
          background-color: hsl(var(--muted));
          color: hsl(var(--foreground));
          border-radius: var(--radius);
          padding: 1rem;
          overflow-x: auto;
        }
        .ql-snow .ql-editor blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin-left: 0;
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        .ql-snow .ql-editor video {
          max-width: 100%;
          border-radius: var(--radius);
          margin: 1rem 0;
        }
        .ql-snow .ql-editor iframe {
          max-width: 100%;
          border-radius: var(--radius);
          margin: 1rem 0;
        }
      `}</style>
      {React.createElement(ReactQuill as any, {
        ref: quillRef,
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
