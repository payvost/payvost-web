
'use client';

// A simple component to render a block of code.
// This is not a real component in the app, but a placeholder for the created file.
export const CodeBlock = ({ code }: { code: string }) => (
    <pre className="mt-2 bg-muted p-4 rounded-lg text-xs overflow-x-auto">
        <code>{code}</code>
    </pre>
);
