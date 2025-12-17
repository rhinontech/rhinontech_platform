import { ResponsiveMode } from "@/types/knowledgeBase";
import { PanelRight } from "lucide-react";

interface PreviewControlsProps {
  responsiveMode: ResponsiveMode;
  onModeChange: (mode: ResponsiveMode) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({
  responsiveMode,
  onModeChange,
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <div className="flex items-center justify-between h-16 px-4 bg-background border-b border-border">
      <div className="flex items-center justify-center flex-1 relative">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="absolute left-0 h-8 w-8 flex items-center justify-center hover:bg-muted rounded"
          >
            <PanelRight className="h-4 w-4 text-foreground" />
          </button>
        )}

        <div className="inline-flex items-center bg-muted rounded-lg p-1">
          <button
            onClick={() => onModeChange("desktop")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              responsiveMode === "desktop"
                ? "text-white bg-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => onModeChange("tablet")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              responsiveMode === "tablet"
                ? "text-white bg-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tablet
          </button>
          <button
            onClick={() => onModeChange("mobile")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              responsiveMode === "mobile"
                ? "text-white bg-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mobile
          </button>
        </div>
      </div>
    </div>
  );
};
