import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

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
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-surface-500 mb-2 max-w-md">
            {this.state.error?.message || "Halaman ini mengalami masalah. Silakan coba muat ulang."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
