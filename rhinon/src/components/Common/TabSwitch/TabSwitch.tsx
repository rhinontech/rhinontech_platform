
import React, { useState } from 'react';

interface Tab {
  label: string;
  count?: number;
  id: string;
}

interface TabSwitchProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const TabSwitch: React.FC<TabSwitchProps> = ({ tabs, defaultTab, onTabChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="border-b border-gray-200 px-4">
      <div className="flex gap-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`
              relative px-1 py-3 text-sm transition-colors
              ${activeTab === tab.id 
                ? 'text-gray-900' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-gray-400">{tab.count}</span>
              )}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};