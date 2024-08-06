const mongoose = require('mongoose');
const Author = require('./models/author');
const Book = require('./models/book');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const authors = [
  {
    name: 'Robert Martin',
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    born: 1963,
  },
  {
    name: 'Fyodor Dostoevsky',
    born: 1821,
  },
  {
    name: 'Joshua Kerievsky', // birthyear not known
  },
  {
    name: 'Sandi Metz', // birthyear not known
  },
];

const books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    genres: ['refactoring'],
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    genres: ['agile', 'patterns', 'design'],
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    genres: ['refactoring'],
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    genres: ['refactoring', 'patterns'],
  },
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    genres: ['refactoring', 'design'],
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    genres: ['classic', 'crime'],
  },
  {
    title: 'Demons',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    genres: ['classic', 'revolution'],
  },
];

async function populateDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    console.log('Clearing existing data...');
    await Author.deleteMany({});
    await Book.deleteMany({});
    console.log('Existing data cleared');

    console.log('Inserting authors...');
    const insertedAuthors = await Author.insertMany(authors);
    console.log('Authors inserted:', insertedAuthors);

    console.log('Inserting books...');
    // Map author names to their IDs
    const authorsMap = insertedAuthors.reduce((map, author) => {
      map[author.name] = author._id;
      return map;
    }, {});

    const booksWithAuthorIds = books.map(book => ({
      ...book,
      author: authorsMap[book.author],
    }));

    const insertedBooks = await Book.insertMany(booksWithAuthorIds);
    console.log('Books inserted:', insertedBooks);

  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    mongoose.connection.close();
  }
}

populateDatabase();