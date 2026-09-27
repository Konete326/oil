import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, recoveryAttempts: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Caught error in UI boundary:", error);
    const isDomMismatch =
      error?.message?.includes("insertBefore") ||
      error?.message?.includes("removeChild") ||
      error?.message?.includes("Node");

    if (isDomMismatch && this.state.recoveryAttempts < 2) {
      setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          recoveryAttempts: prev.recoveryAttempts + 1,
        }));
      }, 50);
    }
  }

  render() {
    if (this.state.hasError && this.state.recoveryAttempts >= 2) {
      return (
        <div className="p-6 text-center space-y-3 bg-card border border-border/80 rounded-2xl m-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Something went wrong in this section.</p>
          <p className="text-xs text-muted-foreground">{this.state.error?.message || "Render exception occurred."}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, recoveryAttempts: 0 });
              window.location.reload();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl cursor-pointer hover:bg-primary/90 transition-colors"
          >
            Reload Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
