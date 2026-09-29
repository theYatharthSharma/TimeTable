import React from 'react';
import { ErrorPage } from './ErrorPage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(
    error: Error,
    errorInfo: React.ErrorInfo
  ) {
    console.error(
      'TimeGen AI application error:',
      error
    );

    console.error(
      'Component stack:',
      errorInfo.componentStack
    );
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoHome = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          type="500"
          title="Something Went Wrong"
          message={
            this.state.error?.message ||
            'An unexpected application error occurred.'
          }
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}