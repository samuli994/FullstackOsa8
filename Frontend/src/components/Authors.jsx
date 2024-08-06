import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import Select from 'react-select';
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries';

const Authors = (props) => {
  const { loading, error, data } = useQuery(ALL_AUTHORS);
  const [selectedOption, setSelectedOption] = useState(null);
  const [born, setBorn] = useState('');

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    context: {
      headers: {
        Authorization: `Bearer ${props.token}`
      }
    },
    refetchQueries: [{ query: ALL_AUTHORS }],
    onError: (error) => {
      console.error('Error:', error.graphQLErrors[0].message);
    },
  });

  if (!props.show) return null;
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const authors = data.allAuthors;
  const options = authors.map((author) => ({
    value: author.name,
    label: author.name,
  }));

  const submit = async (event) => {
    event.preventDefault();
    if (selectedOption && born) {
      try {
        await editAuthor({ variables: { name: selectedOption.value, setBornTo: parseInt(born) } });
        setSelectedOption(null);
        setBorn('');
      } catch (error) {
        console.error('Error updating author:', error.message);
      }
    }
  };

  return (
    <div>
      <h2>Authors</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Born</th>
            <th>Books</th>
          </tr>
        </thead>
        <tbody>
          {authors.map((author) => (
            <tr key={author.name}>
              <td>{author.name}</td>
              <td>{author.born ? author.born : 'N/A'}</td>
              <td>{author.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {props.token && (
        <>
          <h2>Set Birthyear</h2>
          <form onSubmit={submit}>
            <div>
              <label>Name</label>
              <Select
                value={selectedOption}
                onChange={setSelectedOption}
                options={options}
              />
            </div>
            <div>
              <label>Born</label>
              <input
                type="number"
                value={born}
                onChange={({ target }) => setBorn(target.value)}
              />
            </div>
            <button type="submit">Update Author</button>
          </form>
        </>
      )}
    </div>
  );
};

export default Authors;
