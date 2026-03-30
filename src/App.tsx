import { useState } from 'react';
import { BooksProvider } from './context/BooksContext';
import { FloatingNav } from './components/FloatingNav';
import HomeScreen from './screens/HomeScreen';
import LibraryScreen from './screens/LibraryScreen';

type Tab = 'Home' | 'Library';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');

  return (
    <BooksProvider>
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#C3EFD3',
      }}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, display: activeTab === 'Home' ? 'flex' : 'none', flexDirection: 'column' }}>
          <HomeScreen />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: activeTab === 'Library' ? 'flex' : 'none', flexDirection: 'column' }}>
          <LibraryScreen />
        </div>
      </div>

      <FloatingNav activeTab={activeTab} onNavigateToTab={setActiveTab} />
    </div>
    </BooksProvider>
  );
}
