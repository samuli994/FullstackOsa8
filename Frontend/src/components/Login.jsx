import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN } from '../queries';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [login, { error }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      setToken(data.login.value);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ variables: { username, password } });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={({ target }) => setUsername(target.value)}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
          />
        </div>
        <button type="submit">Login</button>
        {error && <p style={{ color: 'red' }}>Invalid credentials</p>}
      </form>
    </div>
  );
};

export default Login;
