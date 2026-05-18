import { Routes, Route } from 'react-router-dom';
import { BooksProvider } from './context/BooksContext';
import { FloatingNav } from './components/FloatingNav';
import HomeScreen from './screens/HomeScreen';
import LibraryScreen from './screens/LibraryScreen';
import BookDetailPage from './screens/BookDetailPage';
import BookEditPage from './screens/BookEditPage';

export default function App() {
  return (
    <BooksProvider>
      <div className="h-full flex flex-col bg-background">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/library" element={<LibraryScreen />} />
            <Route path="/book/:id" element={<BookDetailPage />} />
            <Route path="/book/:id/edit" element={<BookEditPage />} />
          </Routes>
        </div>
        <FloatingNav />
      </div>
    </BooksProvider>
  );
}
