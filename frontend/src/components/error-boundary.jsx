import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Silent recovery from DOM translation mismatch:", error);
    setTimeout(() => {
      this.setState({ hasError: false, error: null });
    }, 0);
  }

  render() {
    return this.props.children;
  }
}
