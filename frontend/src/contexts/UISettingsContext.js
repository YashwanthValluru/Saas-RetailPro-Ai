import React, { createContext, useContext, useState, useEffect } from 'react';

const UISettingsContext = createContext();

const DEFAULT_SETTINGS = {
  sidebar: {
    collapsed: false,
    autoCollapseOnMobile: true,
  },
  borders: {
    radius: 8, // 0-20px
    width: 1, // 0-4px
    style: 'default', // default, subtle, bold
  },
};

export function UISettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ui_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('ui_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('ui_settings');
  };

  const toggleSidebar = () => {
    updateSetting('sidebar', 'collapsed', !settings.sidebar.collapsed);
  };

  // Generate CSS variables for border settings
  const getBorderStyles = () => {
    const { radius, width, style } = settings.borders;
    
    let colorClass = '';
    switch (style) {
      case 'subtle':
        colorClass = 'border-slate-100 dark:border-slate-800';
        break;
      case 'bold':
        colorClass = 'border-slate-300 dark:border-slate-600';
        break;
      default:
        colorClass = 'border-slate-200 dark:border-slate-700';
    }

    return {
      borderRadius: `${radius}px`,
      borderWidth: `${width}px`,
      colorClass,
    };
  };

  const value = {
    settings,
    updateSetting,
    resetSettings,
    toggleSidebar,
    getBorderStyles,
  };

  return (
    <UISettingsContext.Provider value={value}>
      {children}
    </UISettingsContext.Provider>
  );
}

export function useUISettings() {
  const context = useContext(UISettingsContext);
  if (!context) {
    throw new Error('useUISettings must be used within UISettingsProvider');
  }
  return context;
}
