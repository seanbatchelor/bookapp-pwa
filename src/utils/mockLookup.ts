import { LookupResult } from '../types/book';

export const mockLookup = async (query: string): Promise<LookupResult> => {
  await new Promise(res => setTimeout(res, 800));

  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('ulysses')) {
    return { type: 'single', book: { title: 'Ulysses', author: 'James Joyce' } };
  }

  if (lowerQuery.includes('poem')) {
    return {
      type: 'multi',
      options: [
        { title: 'Poems', author: 'Paul Celan' },
        { title: 'Selected Poems', author: 'Louise Glück' },
      ],
    };
  }

  if (lowerQuery.includes('gatsby')) {
    return { type: 'single', book: { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' } };
  }

  if (lowerQuery.includes('harry')) {
    return {
      type: 'multi',
      options: [
        { title: "Harry Potter and the Philosopher's Stone", author: 'J.K. Rowling' },
        { title: 'Harry Potter and the Chamber of Secrets', author: 'J.K. Rowling' },
        { title: 'Dirty Harry', author: 'Various Authors' },
      ],
    };
  }

  return { type: 'none' };
};
