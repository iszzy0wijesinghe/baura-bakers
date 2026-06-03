import { Component, type ErrorInfo, type ReactNode } from "react";
import CriticalBreakPage from "../pages/system/CriticalBreakPage";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unexpected critical UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <CriticalBreakPage
          showHomeButton
          mode={{
            id: "client-critical-break",
            mode: "CRITICAL_BREAK",
            is_enabled: true,
            starts_at: null,
            ends_at: null,
            title: "Unexpected critical break",
            message:
              "The page ran into an unexpected problem. Please refresh the website. If the issue continues, Baura Bakers will need to check it.",
            updated_at: new Date().toISOString(),
            updated_by: null,
          }}
        />
      );
    }

    return this.props.children;
  }
}