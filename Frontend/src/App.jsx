import React, { useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import Login from "./components/Login";
import FavoriteGenreBooks from "./components/FavoriteGenreBooks";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const [favoriteGenre, setFavoriteGenre] = useState(null);

  const logout = () => {
    setToken(null);
    setPage("login");
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {token && (
          <>
            <button onClick={() => setPage("add")}>add book</button>
            <button onClick={() => setPage("recommend")}>recommend</button>
          </>
        )}
        {token ? (
          <button onClick={logout}>logout</button>
        ) : (
          <button onClick={() => setPage("login")}>login</button>
        )}
      </div>

      <Authors show={page === "authors"} token={token} />
      <Books show={page === "books"} token={token} />
      {token && <NewBook show={page === "add"} token={token} />}
      {token && (
        <FavoriteGenreBooks
          show={page === "recommend"}
          favoriteGenre={favoriteGenre}
          setFavoriteGenre={setFavoriteGenre}
        />
      )}
      {!token && page === "login" && <Login setToken={setToken} />}
    </div>
  );
};

export default App;
