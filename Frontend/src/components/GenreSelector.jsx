import React from 'react';

const GenreSelector = ({ genres, setFavoriteGenre }) => (
  <div>
    <h3>Select Your Favorite Genre:</h3>
    {genres.map(genre => (
      <button key={genre} onClick={() => setFavoriteGenre(genre)}>
        {genre}
      </button>
    ))}
  </div>
);

export default GenreSelector;
