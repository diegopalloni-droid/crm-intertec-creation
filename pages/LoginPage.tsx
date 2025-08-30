import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showMasterLogin, setShowMasterLogin] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [masterError, setMasterError] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleMasterPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (masterPassword === "Masterpass") {
      const result = await login('master');
      if (!result.success) {
         setMasterError("Errore di login master. Contattare l'assistenza.");
      }
    } else {
      setMasterError("Password errata.");
      setMasterPassword('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username || !password) {
        setLoginError('Nome utente e password sono obbligatori.');
        return;
    }
    const result = await login(username, password); 
    if (!result.success) {
      switch (result.reason) {
        case 'unauthorized':
          setLoginError('Utente non trovato o non autorizzato.');
          break;
        case 'disabled':
          setLoginError('Il tuo account è stato disabilitato.');
          break;
        case 'invalid_credentials':
          setLoginError('Credenziali non valide.');
          break;
        default:
          setLoginError('Si è verificato un errore durante il login.');
          break;
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
      <header className="mb-8 flex flex-col items-center">
        <Logo />
        <p className="text-gray-500 mt-4">
          Accedi per continuare
        </p>
      </header>
      <div className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nome Utente</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoComplete="username"
                    aria-label="Nome Utente"
                />
            </div>
             <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                    id="password-login"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoComplete="current-password"
                    aria-label="Password"
                />
            </div>
            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
            <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-900 text-white font-medium rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Accedi
            </button>
        </form>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs text-gray-400">O</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {!showMasterLogin ? (
          <button
            onClick={() => {
                setShowMasterLogin(true);
                setLoginError('');
            }}
            className="w-full flex items-center justify-center py-2 px-4 bg-gray-700 border border-transparent rounded-md shadow-sm text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm"
          >
            Accedi come Master
          </button>
        ) : (
          <form onSubmit={handleMasterPasswordSubmit} className="space-y-3 pt-4 border-t mt-4 text-left">
            <label htmlFor="master-password" className="text-sm font-medium text-gray-700 mb-1 block">
                Inserisci password Master
            </label>
            <input
              id="master-password"
              type="password"
              value={masterPassword}
              onChange={(e) => {
                setMasterPassword(e.target.value);
                setMasterError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {masterError && <p className="text-red-500 text-sm mt-1">{masterError}</p>}
            <div className="flex gap-2 pt-2">
                <button 
                    type="button" 
                    onClick={() => setShowMasterLogin(false)}
                    className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
                 >
                    Annulla
                 </button>
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-900 text-white rounded-md hover:bg-blue-800 text-sm font-medium"
                >
                  Conferma
                </button>
            </div>
          </form>
        )}
      </div>
      <footer className="mt-8">
          <p className="text-xs text-gray-400">Utente demo: mario.rossi / password123</p>
      </footer>
    </div>
  );
};

export default LoginPage;