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
    <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-4 z-50">
      <div className="flex flex-row rounded-full overflow-hidden bg-primary">
        {ITEMS.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => { if (!isActive) onNavigateToTab(item.tab); }}
              className={`border-0 my-1 mx-0.5 py-3.5 px-6 rounded-full font-sans text-sm font-medium text-white leading-5 [-webkit-tap-highlight-color:transparent] ${isActive ? 'bg-green-700 cursor-default' : 'bg-transparent cursor-pointer'}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
