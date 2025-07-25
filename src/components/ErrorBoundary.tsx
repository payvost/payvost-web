"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Specifically check for ChunkLoadError
      if (this.state.error?.name === "ChunkLoadError") {
        // The most reliable way to fix a chunk error is a full page reload.
        if (typeof window !== "undefined") {
          window.location.reload();
        }
        return <h1>Loading a new version of the application...</h1>;
      }

      // You can render any custom fallback UI for other errors
      return <h1>Something went wrong. Please try refreshing the page.</h1>;
    }

    return this.props.children;
  }
}