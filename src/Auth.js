import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Eye, EyeOff, User, Lock, Mail, Github, Apple } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name
            }
          }
        });
        if (error) throw error;
        alert('Sprawdź swoją skrzynkę e-mail, aby zweryfikować konto!');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider) => {
    setOauthLoading(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      alert(`Błąd logowania przez ${provider}: ${error.message}`);
    } finally {
      setOauthLoading(null);
    }
  };

  // Ikona Microsoft (SVG)
  const MicrosoftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 21 21" fill="currentColor">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="12" y="1" width="9" height="9" fill="#00a4ef"/>
      <rect x="1" y="12" width="9" height="9" fill="#ffb900"/>
      <rect x="12" y="12" width="9" height="9" fill="#7fba00"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Rezerwacja Drukarki 3D
          </h1>
          <p className="text-gray-600">Prusa i3 MK3 - Sala 309</p>
        </div>

        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 text-center rounded-l-lg border ${
              isLogin 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-gray-100 text-gray-600 border-gray-300'
            }`}
          >
            Logowanie
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 text-center rounded-r-lg border ${
              !isLogin 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-gray-100 text-gray-600 border-gray-300'
            }`}
          >
            Rejestracja
          </button>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuthSignIn('github')}
            disabled={oauthLoading !== null}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {oauthLoading === 'github' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Github size={16} />
            )}
            Kontynuuj z GitHub
          </button>

          {/* <button
            onClick={() => handleOAuthSignIn('azure')}
            disabled={oauthLoading !== null}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {oauthLoading === 'azure' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <MicrosoftIcon />
            )}
            Kontynuuj z Microsoft
          </button>

          <button
            onClick={() => handleOAuthSignIn('apple')}
            disabled={oauthLoading !== null}
            className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {oauthLoading === 'apple' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Apple size={16} />
            )}
            Kontynuuj z Apple
          </button> */}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-gray-300 flex-grow"></div>
          <span className="px-3 text-sm text-gray-500 bg-white">lub</span>
          <div className="border-t border-gray-300 flex-grow"></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Imię i nazwisko</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jan Kowalski"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jan@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hasło</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                minLength="6"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">Minimum 6 znaków</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || oauthLoading !== null}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : null}
            {isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? (
            <p>
              Nie masz konta?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-blue-600 hover:text-blue-800"
                disabled={loading || oauthLoading !== null}
              >
                Zarejestruj się
              </button>
            </p>
          ) : (
            <p>
              Masz już konto?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-blue-600 hover:text-blue-800"
                disabled={loading || oauthLoading !== null}
              >
                Zaloguj się
              </button>
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Logując się, wyrażasz zgodę na nasze warunki korzystania z usługi
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;