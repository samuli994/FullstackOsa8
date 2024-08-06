import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_BOOK, ALL_AUTHORS, ALL_BOOKS } from '../queries';

const NewBook = (props) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [published, setPublished] = useState('');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);

  const [addBook] = useMutation(ADD_BOOK, {
    context: {
      headers: {
        Authorization: `Bearer ${props.token}`
      }
    },
    refetchQueries: [{ query: ALL_AUTHORS }, { query: ALL_BOOKS }],
    onError: (error) => {
      // Improved error handling
      console.error('Error details:', error);
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        console.error('GraphQL error:', error.graphQLErrors[0].message);
      } else {
        console.error('Network or other error:', error.message);
      }
    },
  });

  if (!props.show) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (title && author && published && genres.length > 0) {
      try {
        await addBook({ variables: { title, author, published: parseInt(published), genres } });
        setTitle('');
        setPublished('');
        setAuthor('');
        setGenres([]);
        setGenre('');
      } catch (error) {
        // Error is now handled in onError callback
      }
    } else {
      console.error('All fields must be filled in and at least one genre must be added.');
    }
  };

  const addGenre = () => {
    if (genre) {
      setGenres([...genres, genre]);
      setGenre('');
    }
  };

  return (
    <div>
      <h2>Add a New Book</h2>
      <form onSubmit={submit}>
        <div>
          <label>Title</label>
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          <label>Author</label>
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          <label>Published</label>
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <label>Genre</label>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">Add Genre</button>
        </div>
        <div>
          <label>Genres</label>
          <div>{genres.join(', ')}</div>
        </div>
        <button type="submit">Create Book</button>
      </form>
    </div>
  );
};

export default NewBook;
