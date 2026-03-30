import { green } from '../theme/colors';

type Tab = 'Home' | 'Library';

const ITEMS: { label: string; tab: Tab }[] = [
  { label: 'List', tab: 'Home' },
  { label: 'Library', tab: 'Library' },
];

type FloatingNavProps = {
  activeTab: Tab;
  onNavigateToTab: (tab: Tab) => void;
};

export function FloatingNav({ activeTab, onNavigateToTab }: FloatingNavProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        left: 16,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          borderRadius: 9999,
          overflow: 'hidden',
          backgroundColor: green[500],
        }}
      >
        {ITEMS.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => { if (!isActive) onNavigateToTab(item.tab); }}
              style={{
                border: 'none',
                cursor: isActive ? 'default' : 'pointer',
                margin: '4px 2px',
                padding: '14px 24px',
                borderRadius: 9999,
                backgroundColor: isActive ? green[700] : 'transparent',
                color: '#ffffff',
                fontFamily: '"Work Sans", sans-serif',
                fontSize: 15,
                fontWeight: 500,
                lineHeight: '20px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
