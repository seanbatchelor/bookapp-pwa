import { useLocation, useNavigate } from 'react-router-dom';

const ITEMS = [
  { label: 'List', path: '/' },
  { label: 'Library', path: '/library' },
];

export function FloatingNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (pathname.startsWith('/book/')) return null;

  return (
    <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-4 z-50">
      <div className="flex flex-row rounded-full overflow-hidden bg-primary">
        {ITEMS.map((item) => {
          const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => { if (!isActive) navigate(item.path); }}
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
