import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { ALL_BOOKS } from '../queries';

const GenreSelector = ({ genres, setFavoriteGenre }) => (
  <div>
    <h3>Select Your Favorite Genre:</h3>
    {genres.map(genre => (
      <button key={genre} onClick={() => setFavoriteGenre(genre)}>
        {genre}
      </button>
    ))}
    <button onClick={() => setFavoriteGenre(null)}>All</button>
  </div>
);

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genres, setGenres] = useState([]);
  
  const { loading, error, data } = useQuery(ALL_BOOKS, {
    onCompleted: () => {
      if (data && data.allBooks) {
        // Extract genres from books
        const extractedGenres = [...new Set(data.allBooks.flatMap(book => book.genres))];
        setGenres(extractedGenres);
      }
    },
  });

  // Handle cases where data might not be immediately available
  useEffect(() => {
    if (data && data.allBooks) {
      const extractedGenres = [...new Set(data.allBooks.flatMap(book => book.genres))];
      setGenres(extractedGenres);
    }
  }, [data]);

  if (!props.show) return null;
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const books = selectedGenre 
    ? data.allBooks.filter(book => book.genres.includes(selectedGenre))
    : data.allBooks;

  return (
    <div>
      <h2>Books</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Published</th>
            <th>Genres</th>
          </tr>
        </thead>
        <tbody>
          {books.map(book => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
              <td>{book.genres.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {props.token && (
        <GenreSelector genres={genres} setFavoriteGenre={setSelectedGenre} />
      )}
    </div>
  );
};

export default Books;
