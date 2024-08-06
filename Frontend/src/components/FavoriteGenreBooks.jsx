import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { ALL_BOOKS } from '../queries';

const FavoriteGenreBooks = ({ show, favoriteGenre, setFavoriteGenre }) => {
  const [inputGenre, setInputGenre] = useState('');
  const { loading, error, data } = useQuery(ALL_BOOKS);

  if (!show) return null;
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const books = favoriteGenre
    ? data.allBooks.filter(book => book.genres.includes(favoriteGenre))
    : [];

  return (
    <div>
      <h2>Recommendations</h2>
      
      <div>
        {favoriteGenre ? (
          <div>
            <p>Your favorite genre: {favoriteGenre}</p>
            <button onClick={() => setFavoriteGenre(null)}>Remove Favorite Genre</button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={inputGenre}
              onChange={({ target }) => setInputGenre(target.value)}
              placeholder="Type your favorite genre"
            />
            <button onClick={() => setFavoriteGenre(inputGenre)}>
              Set Favorite Genre
            </button>
          </div>
        )}
      </div>
      
      {favoriteGenre && (
        <div>
          <h3>Books in {favoriteGenre} Genre:</h3>
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
              {books.length > 0 ? (
                books.map(book => (
                  <tr key={book.title}>
                    <td>{book.title}</td>
                    <td>{book.author.name}</td>
                    <td>{book.published}</td>
                    <td>{book.genres.join(', ')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No books found in this genre.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FavoriteGenreBooks;
