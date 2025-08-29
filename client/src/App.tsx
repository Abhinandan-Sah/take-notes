import { useState, useEffect } from 'react';
import axios from 'axios';

const PageEnum = {
  SIGNUP: 'signup',
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
};

const API_BASE_URL = 'http://localhost:5000/api';

interface User {
  _id: string;
  name: string;
  email: string;
  dateOfBirth?: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

const Input = ({ label, type, value, onChange, placeholder, error, disabled }) => (
  <div className="flex flex-col mb-4">
    <label className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`p-3 rounded-lg border focus:outline-none focus:ring-2 ${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Signup = ({ onSwitchPage, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timerId;
    if (resendTimer > 0) {
      timerId = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    }
    return () => clearTimeout(timerId);
  }, [resendTimer]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/request-signup-otp`, { name, dateOfBirth, email });
      if (response.data.success) {
        setIsOTPSent(true);
        setResendTimer(60); 
        setError(''); 
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to send OTP.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupWithOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, { name, email, otp });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        onLoginSuccess();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Signup failed. Invalid OTP or email.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center">Sign up</h2>
        {error && <div className="text-red-500 text-center p-2 bg-red-100 rounded-lg">{error}</div>}
        <form onSubmit={isOTPSent ? handleSignupWithOtp : handleRequestOtp} className="space-y-4">
          <Input
            label="Your Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jonas Khanwald"
            disabled={isOTPSent}
            error={null} 
          />
          <Input
            label="Date of Birth"
            type="text" 
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            placeholder="11 December 1997"
            disabled={isOTPSent}
            error={null} 
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jonas_kahnwald@gmail.com"
            disabled={isOTPSent}
            error={null} 
          />
          {isOTPSent && (
            <div className="flex flex-col mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-1">OTP</label>
              <div className="relative">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="p-3 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading || resendTimer > 0}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-600 disabled:text-gray-400"
                >
                  {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {loading ? (isOTPSent ? 'Signing up...' : 'Sending OTP...') : 'Sign up'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <button onClick={() => onSwitchPage(PageEnum.LOGIN)} className="text-blue-600 hover:underline font-bold">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

const Login = ({ onSwitchPage, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timerId;
    if (resendTimer > 0) {
      timerId = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    }
    return () => clearTimeout(timerId);
  }, [resendTimer]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/request-otp`, { email });
      if (response.data.success) {
        setIsOTPSent(true);
        setResendTimer(60);
        setError('');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to send OTP.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, otp });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        onLoginSuccess();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Login failed. Invalid OTP or email.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center">Sign in</h2>
        <p className="text-center text-gray-500">Please login to continue to your account.</p>
        {error && <div className="text-red-500 text-center p-2 bg-red-100 rounded-lg">{error}</div>}
        <form onSubmit={isOTPSent ? handleLoginWithOtp : handleRequestOtp} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jonas_kahnwald@gmail.com"
            disabled={isOTPSent}
            error={null}
          />
          {isOTPSent && (
            <div className="flex flex-col mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-1">OTP</label>
              <div className="relative">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="p-3 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading || resendTimer > 0}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-600 disabled:text-gray-400"
                >
                  {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input type="checkbox" id="keepMeLoggedIn" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"/>
              <label htmlFor="keepMeLoggedIn" className="ml-2 text-sm text-gray-900">Keep me logged in</label>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {loading ? (isOTPSent ? 'Logging in...' : 'Sending OTP...') : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Need an account?{' '}
          <button onClick={() => onSwitchPage(PageEnum.SIGNUP)} className="text-blue-600 hover:underline font-bold">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};

const Dashboard = ({ user, notes, onLogout, onAddNote, onDeleteNote }) => {
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteTitle || !newNoteContent) {
      setError('Title and content are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await axios.post(
        `${API_BASE_URL}/notes/create`,
        { title: newNoteTitle, content: newNoteContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowCreateNoteModal(false);
      onAddNote();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to add note.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await axios.delete(
        `${API_BASE_URL}/notes/delete/${noteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onDeleteNote(); 
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to delete note.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4">
      <header className="flex justify-between items-center py-4 px-4 sm:px-8 bg-white shadow-sm rounded-xl">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </header>
      <main className="flex-1 mt-6">
        <div className="max-w-xl mx-auto space-y-8">
          <section className="bg-white p-6 rounded-xl shadow-md space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold">Welcome, {user.name} !</h2>
            <p className="text-gray-600 text-sm sm:text-base">Email: {user.email}</p>
          </section>
          
          <section className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            <button
              onClick={() => setShowCreateNoteModal(true)}
              className="w-full p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Note
            </button>
            <div className="space-y-4 mt-4">
              {notes.length === 0 ? (
                <p className="text-center text-gray-500">You have no notes yet.</p>
              ) : (
                notes.map((note) => (
                  <div key={note._id} className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                    <h4 className="text-sm font-semibold">{note.title}</h4>
                    <button onClick={() => handleDeleteNote(note._id)} className="text-red-500 hover:text-red-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {showCreateNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create New Note</h3>
              <button onClick={() => setShowCreateNoteModal(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            {error && <div className="text-red-500 text-center p-2 bg-red-100 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleAddNote} className="space-y-4">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note Title"
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Note Content"
                className="w-full p-3 rounded-lg border border-gray-300 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
              >
                {loading ? 'Adding...' : 'Add Note'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState(PageEnum.LOGIN);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);
        const notesRes = await axios.get(`${API_BASE_URL}/notes/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotes(notesRes.data);
        setCurrentPage(PageEnum.DASHBOARD);
      } catch (err: unknown) {
        localStorage.removeItem('token');
        setUser(null);
        setNotes([]);
        setCurrentPage(PageEnum.LOGIN);
        if (axios.isAxiosError(err) && err.response) {
          console.error('Failed to fetch user data:', err.response.data.message || err.message);
        } else {
          console.error('An unexpected error occurred:', err);
        }
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLoginSuccess = () => {
    fetchUserData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setNotes([]);
    setCurrentPage(PageEnum.LOGIN);
  };

  // Re-fetch notes after an add or delete operation
  const handleNoteOperation = () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_BASE_URL}/notes/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setNotes(res.data))
      .catch((err: unknown) => {
        if (axios.isAxiosError(err) && err.response) {
          console.error('Failed to re-fetch notes:', err.response.data.message || err.message);
        } else {
          console.error('An unexpected error occurred:', err);
        }
      });
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case PageEnum.SIGNUP:
        return <Signup onSwitchPage={setCurrentPage} onLoginSuccess={handleLoginSuccess} />;
      case PageEnum.LOGIN:
        return <Login onSwitchPage={setCurrentPage} onLoginSuccess={handleLoginSuccess} />;
      case PageEnum.DASHBOARD:
        if (user) {
          return <Dashboard user={user} notes={notes} onLogout={handleLogout} onAddNote={handleNoteOperation} onDeleteNote={handleNoteOperation} />;
        }
        return <p>Loading...</p>;
      default:
        return <Login onSwitchPage={setCurrentPage} onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return <div className="app-container font-sans bg-gray-50">{renderPage()}</div>;
};

export default App;
