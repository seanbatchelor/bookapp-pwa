import { BookItem } from '../types/book';

// Flip this to false to test the empty state of the app
export const USE_SEED_DATA = false;

// sortOrder values: To Read list sorts descending so higher = nearer top.
// Seed values use 100–199 range so new books (Date.now()) always appear above them.
// Read books use movedAt for ordering (ascending = oldest read at top).
export const SEED_BOOKS: BookItem[] = [
  // To Read — shuffled order, sortOrder 100–134
  { id: 's019', state: 'FOUND', sortOrder: 134, originalText: 'It',                            resolvedTitle: 'It',                            resolvedAuthor: 'Stephen King',              resolvedYear: '1986' },
  { id: 's008', state: 'FOUND', sortOrder: 133, originalText: 'Dune',                          resolvedTitle: 'Dune',                          resolvedAuthor: 'Frank Herbert',             resolvedYear: '1965' },
  { id: 's027', state: 'FOUND', sortOrder: 132, originalText: 'Normal People',                 resolvedTitle: 'Normal People',                 resolvedAuthor: 'Sally Rooney',              resolvedYear: '2018' },
  { id: 's010', state: 'FOUND', sortOrder: 131, originalText: 'East of Eden',                  resolvedTitle: 'East of Eden',                  resolvedAuthor: 'John Steinbeck',            resolvedYear: '1952' },
  { id: 's030', state: 'FOUND', sortOrder: 130, originalText: 'Piranesi',                      resolvedTitle: 'Piranesi',                      resolvedAuthor: 'Susanna Clarke',            resolvedYear: '2020' },
  { id: 's036', state: 'FOUND', sortOrder: 129, originalText: 'Slaughterhouse-Five',           resolvedTitle: 'Slaughterhouse-Five',           resolvedAuthor: 'Kurt Vonnegut',             resolvedYear: '1969' },
  { id: 's001', state: 'FOUND', sortOrder: 128, originalText: 'Anna Karenina',                 resolvedTitle: 'Anna Karenina',                 resolvedAuthor: 'Leo Tolstoy',               resolvedYear: '1878' },
  { id: 's016', state: 'FOUND', sortOrder: 127, originalText: 'Hamnet',                        resolvedTitle: 'Hamnet',                        resolvedAuthor: "Maggie O'Farrell",          resolvedYear: '2020' },
  { id: 's006', state: 'FOUND', sortOrder: 126, originalText: 'Crime and Punishment',          resolvedTitle: 'Crime and Punishment',          resolvedAuthor: 'Fyodor Dostoevsky',         resolvedYear: '1866' },
  { id: 's029', state: 'FOUND', sortOrder: 125, originalText: "On Earth We're Briefly Gorgeous",resolvedTitle: "On Earth We're Briefly Gorgeous",resolvedAuthor: 'Ocean Vuong',             resolvedYear: '2019' },
  { id: 's021', state: 'FOUND', sortOrder: 124, originalText: 'Kindred',                       resolvedTitle: 'Kindred',                       resolvedAuthor: 'Octavia E. Butler',         resolvedYear: '1979' },
  { id: 's041', state: 'FOUND', sortOrder: 123, originalText: 'White Noise',                   resolvedTitle: 'White Noise',                   resolvedAuthor: 'Don DeLillo',               resolvedYear: '1985' },
  { id: 's014', state: 'FOUND', sortOrder: 122, originalText: 'The Great Gatsby',              resolvedTitle: 'The Great Gatsby',              resolvedAuthor: 'F. Scott Fitzgerald',       resolvedYear: '1925' },
  { id: 's002', state: 'FOUND', sortOrder: 121, originalText: 'American Gods',                 resolvedTitle: 'American Gods',                 resolvedAuthor: 'Neil Gaiman',               resolvedYear: '2001' },
  { id: 's039', state: 'FOUND', sortOrder: 120, originalText: 'Ulysses',                       resolvedTitle: 'Ulysses',                       resolvedAuthor: 'James Joyce',               resolvedYear: '1922' },
  { id: 's011', state: 'FOUND', sortOrder: 119, originalText: 'Educated',                      resolvedTitle: 'Educated',                      resolvedAuthor: 'Tara Westover',             resolvedYear: '2018' },
  { id: 's028', state: 'FOUND', sortOrder: 118, originalText: 'Neuromancer',                   resolvedTitle: 'Neuromancer',                   resolvedAuthor: 'William Gibson',            resolvedYear: '1984' },
  { id: 's004', state: 'FOUND', sortOrder: 117, originalText: 'Beloved',                       resolvedTitle: 'Beloved',                       resolvedAuthor: 'Toni Morrison',             resolvedYear: '1987' },
  { id: 's033', state: 'FOUND', sortOrder: 116, originalText: 'Rebecca',                       resolvedTitle: 'Rebecca',                       resolvedAuthor: 'Daphne du Maurier',         resolvedYear: '1938' },
  { id: 's012', state: 'FOUND', sortOrder: 115, originalText: 'Foundation',                    resolvedTitle: 'Foundation',                    resolvedAuthor: 'Isaac Asimov',              resolvedYear: '1951' },
  { id: 's044', state: 'FOUND', sortOrder: 114, originalText: 'The Year of Magical Thinking',  resolvedTitle: 'The Year of Magical Thinking',  resolvedAuthor: 'Joan Didion',               resolvedYear: '2005' },
  { id: 's007', state: 'FOUND', sortOrder: 113, originalText: 'Catch-22',                      resolvedTitle: 'Catch-22',                      resolvedAuthor: 'Joseph Heller',             resolvedYear: '1961' },
  { id: 's018', state: 'FOUND', sortOrder: 112, originalText: 'Invisible Man',                 resolvedTitle: 'Invisible Man',                 resolvedAuthor: 'Ralph Ellison',             resolvedYear: '1952' },
  { id: 's035', state: 'FOUND', sortOrder: 111, originalText: 'Sapiens',                       resolvedTitle: 'Sapiens: A Brief History of Humankind', resolvedAuthor: 'Yuval Noah Harari', resolvedYear: '2011' },
  { id: 's024', state: 'FOUND', sortOrder: 110, originalText: "The Left Hand of Darkness",     resolvedTitle: "The Left Hand of Darkness",     resolvedAuthor: 'Ursula K. Le Guin',         resolvedYear: '1969' },
  { id: 's020', state: 'FOUND', sortOrder: 109, originalText: 'Just Kids',                     resolvedTitle: 'Just Kids',                     resolvedAuthor: 'Patti Smith',               resolvedYear: '2010' },
  { id: 's037', state: 'FOUND', sortOrder: 108, originalText: 'The Remains of the Day',        resolvedTitle: 'The Remains of the Day',        resolvedAuthor: 'Kazuo Ishiguro',            resolvedYear: '1989' },
  { id: 's015', state: 'FOUND', sortOrder: 107, originalText: "The Girl with the Dragon Tattoo",resolvedTitle: "The Girl with the Dragon Tattoo",resolvedAuthor: 'Stieg Larsson',           resolvedYear: '2005' },
  { id: 's032', state: 'FOUND', sortOrder: 106, originalText: 'Quiet',                         resolvedTitle: 'Quiet: The Power of Introverts',resolvedAuthor: 'Susan Cain',                resolvedYear: '2012' },
  { id: 's043', state: 'FOUND', sortOrder: 105, originalText: 'Xenogenesis',                   resolvedTitle: 'Xenogenesis',                   resolvedAuthor: 'Octavia E. Butler',         resolvedYear: '1987' },
  { id: 's023', state: 'FOUND', sortOrder: 104, originalText: 'Lolita',                        resolvedTitle: 'Lolita',                        resolvedAuthor: 'Vladimir Nabokov',          resolvedYear: '1955' },
  { id: 's025', state: 'FOUND', sortOrder: 103, originalText: 'Middlemarch',                   resolvedTitle: 'Middlemarch',                   resolvedAuthor: 'George Eliot',              resolvedYear: '1871' },
  { id: 's040', state: 'FOUND', sortOrder: 102, originalText: 'Vanity Fair',                   resolvedTitle: 'Vanity Fair',                   resolvedAuthor: 'William Makepeace Thackeray',resolvedYear: '1848' },
  { id: 's045', state: 'FOUND', sortOrder: 101, originalText: 'Zorba the Greek',               resolvedTitle: 'Zorba the Greek',               resolvedAuthor: 'Nikos Kazantzakis',         resolvedYear: '1946' },

  // Read — movedAt ascending = oldest read at top of Read section
  { id: 's003', state: 'READ', sortOrder: 10, movedAt: 10, originalText: 'Atomic Habits',       resolvedTitle: 'Atomic Habits',       resolvedAuthor: 'James Clear',        resolvedYear: '2018' },
  { id: 's034', state: 'READ', sortOrder: 20, movedAt: 20, originalText: 'The Road',            resolvedTitle: 'The Road',            resolvedAuthor: 'Cormac McCarthy',    resolvedYear: '2006' },
  { id: 's005', state: 'READ', sortOrder: 30, movedAt: 30, originalText: 'Brave New World',     resolvedTitle: 'Brave New World',     resolvedAuthor: 'Aldous Huxley',      resolvedYear: '1932' },
  { id: 's013', state: 'READ', sortOrder: 40, movedAt: 40, originalText: 'Flowers for Algernon',resolvedTitle: 'Flowers for Algernon',resolvedAuthor: 'Daniel Keyes',       resolvedYear: '1966' },
  { id: 's017', state: 'READ', sortOrder: 50, movedAt: 50, originalText: 'Homegoing',           resolvedTitle: 'Homegoing',           resolvedAuthor: 'Yaa Gyasi',          resolvedYear: '2016' },
  { id: 's022', state: 'READ', sortOrder: 60, movedAt: 60, originalText: 'Klara and the Sun',   resolvedTitle: 'Klara and the Sun',   resolvedAuthor: 'Kazuo Ishiguro',     resolvedYear: '2021' },
  { id: 's026', state: 'READ', sortOrder: 70, movedAt: 70, originalText: 'Mythos',              resolvedTitle: 'Mythos',              resolvedAuthor: 'Stephen Fry',        resolvedYear: '2017' },
  { id: 's031', state: 'READ', sortOrder: 80, movedAt: 80, originalText: 'Project Hail Mary',   resolvedTitle: 'Project Hail Mary',   resolvedAuthor: 'Andy Weir',          resolvedYear: '2021' },
  { id: 's009', state: 'READ', sortOrder: 90, movedAt: 90, originalText: 'Demon Copperhead',    resolvedTitle: 'Demon Copperhead',    resolvedAuthor: 'Barbara Kingsolver', resolvedYear: '2022' },
  { id: 's038', state: 'READ', sortOrder: 95, movedAt: 95, originalText: 'Things Fall Apart',   resolvedTitle: 'Things Fall Apart',   resolvedAuthor: 'Chinua Achebe',      resolvedYear: '1958' },
  { id: 's042', state: 'READ', sortOrder: 99, movedAt: 99, originalText: 'Wolf Hall',           resolvedTitle: 'Wolf Hall',           resolvedAuthor: 'Hilary Mantel',      resolvedYear: '2009' },
];
