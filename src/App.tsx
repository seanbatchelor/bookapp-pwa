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
      <div className="h-full flex flex-col bg-background">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className={`flex-1 min-h-0 flex-col ${activeTab === 'Home' ? 'flex' : 'hidden'}`}>
            <HomeScreen />
          </div>
          <div className={`flex-1 min-h-0 flex-col ${activeTab === 'Library' ? 'flex' : 'hidden'}`}>
            <LibraryScreen />
          </div>
        </div>

        <FloatingNav activeTab={activeTab} onNavigateToTab={setActiveTab} />
      </div>
    </BooksProvider>
  );
}
