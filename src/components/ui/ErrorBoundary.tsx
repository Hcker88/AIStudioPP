/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertCircle size={48} className="text-red-500" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter italic serif">Hamari system is busy.</h1>
              <p className="text-gray-400 leading-relaxed">
                Something went wrong on our end. We've logged the error and our team is looking into it.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 font-bold rounded-sm hover:scale-105 transition-transform"
            >
              <RefreshCw size={20} /> TRY AGAIN
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
