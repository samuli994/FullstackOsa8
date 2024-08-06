import React, { useState, useEffect } from 'react'
import { createClient } from 'graphql-ws'
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, useSubscription, gql } from '@apollo/client'

const client = createClient({
  url: 'wss://localhost:4000/graphql',
})

const ALL_BOOKS_QUERY = gql`
  query {
    allBooks {
      title
      published
      author {
        name
      }
      genres
    }
  }
`

const BOOK_ADDED_SUBSCRIPTION = gql`
  subscription {
    bookAdded {
      title
      published
      author {
        name
      }
      genres
    }
  }
`

const Books = () => {
  const { data, loading, error } = useQuery(ALL_BOOKS_QUERY)
  const { data: subscriptionData } = useSubscription(BOOK_ADDED_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data && subscriptionData.data.bookAdded) {
        const newBook = subscriptionData.data.bookAdded
        setBooks((prevBooks) => [...prevBooks, newBook])
      }
    },
  })

  const [books, setBooks] = useState([]);

  useEffect(() => {
    if (data && data.allBooks) {
      setBooks(data.allBooks)
    }
  }, [data])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h2>Books</h2>
      <ul>
        {books.map((book) => (
          <li key={book.title}>
            {book.title} by {book.author.name} ({book.published})
          </li>
        ))}
      </ul>
    </div>
  )
}

const App = () => (
  <ApolloProvider client={new ApolloClient({ uri: 'http://localhost:4000', cache: new InMemoryCache() })}>
    <Books />
  </ApolloProvider>
)

export default App