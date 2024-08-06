const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer')

const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const http = require('http')
const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
require('dotenv').config()

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET

console.log('Connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message)
  })

const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int
    authorCount: Int
    allAuthors: [Author!]
    allBooks(author: String, genre: String): [Book!]
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book!
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Book!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }
`

const resolvers = {
  Query: {
    bookCount: async () => Book.countDocuments(),
    authorCount: async () => Author.countDocuments(),
    allAuthors: async () => {
      try {
        // Käytä MongoDB:n aggregaatiota yhdistääksesi kirjailijat ja kirjojen määrät
        const authors = await Author.aggregate([
          {
            $lookup: {
              from: 'books', // "books" on kokoelman nimi MongoDB:ssä
              localField: '_id',
              foreignField: 'author',
              as: 'books'
            }
          },
          {
            $addFields: {
              bookCount: { $size: '$books' } // Lisää kenttä, joka sisältää kirjojen määrän
            }
          },
          {
            $project: {
              name: 1, // Näytä vain tarvittavat kentät
              bookCount: 1
            }
          }
        ]);

        return authors;
      } catch (error) {
        console.error('Error fetching authors:', error);
        throw new GraphQLError('Error fetching authors', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            error
          }
        });
      }
    },
    allBooks: async (parent, args) => {
      let filter = {}

      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        filter.author = author ? author._id : null
      }

      if (args.genre) {
        filter.genres = { $in: [args.genre] }
      }

      return Book.find(filter).populate('author')
    },
    me: (parent, args, context) => {
      return context.currentUser
    }
  },
  Mutation: {
    addBook: async (parent, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED'
          }
        })
      }

      let author = await Author.findOne({ name: args.author })

      if (!author) {
        author = new Author({ name: args.author })
        try {
          await author.save()
        } catch (error) {
          if (error.name === 'ValidationError') {
            throw new GraphQLError('Saving author failed due to validation error', {
              extensions: {
                code: 'BAD_USER_INPUT',
                invalidArgs: args.author,
                error
              }
            })
          }
          throw error
        }
      }

      const book = new Book({ ...args, author: author._id })

      try {
        await book.save()
      } catch (error) {
        console.error('Error saving book:', error)
        if (error.name === 'ValidationError') {
          throw new GraphQLError('Saving book failed due to validation error', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.title,
              error
            }
          })
        }
        throw error
      }

      return book.populate('author')
    },
    editAuthor: async (parent, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED'
          }
        })
      }

      const author = await Author.findOne({ name: args.name })

      if (!author) {
        throw new GraphQLError('Author not found', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name
          }
        })
      }

      author.born = args.setBornTo

      try {
        await author.save()
      } catch (error) {
        if (error.name === 'ValidationError') {
          throw new GraphQLError('Saving author failed due to validation error', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        }
        throw error
      }

      return author
    },
    createUser: async (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      try {
        return await user.save()
      } catch (error) {
        if (error.name === 'ValidationError') {
          throw new GraphQLError('Creating the user failed due to validation error', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.username,
              error
            }
          })
        }
        throw error
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new GraphQLError('Wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    }
  },
  Author: {
    bookCount: async (parent) => {
      return Book.countDocuments({ author: parent._id })
    }
  },
  Book: {
    author: async (parent) => {
      return Author.findById(parent.author)
    }
  }
}

const app = express()
app.use(cors())

const httpServer = http.createServer(app)
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
})

const serverCleanup = useServer({ schema: { typeDefs, resolvers }, pubsub }, wsServer)

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose()
          }
        }
      }
    }
  ]
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET)
        const currentUser = await User.findById(decodedToken.id)
        return { currentUser }
      } catch (error) {
        console.error('Error decoding token:', error)
      }
    }
    return {}
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
