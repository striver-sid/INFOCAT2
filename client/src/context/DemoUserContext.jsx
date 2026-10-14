import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchUsers } from '../api/user.api.js';

const DemoUserContext = createContext(null);

export function DemoUserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      setError(null);

      // Keep previously selected user if still present, or default to Alice (first user)
      setCurrentUser((prev) => {
        if (prev) {
          const match = fetchedUsers.find((u) => u.id === prev.id);
          if (match) return match;
        }
        return fetchedUsers[0] || null;
      });
    } catch (err) {
      console.error('[DemoUserContext] Failed to load demo users:', err);
      setError(err.message || 'Could not fetch demonstration users from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const selectUser = (userId) => {
    const numericId = Number(userId);
    const selected = users.find((u) => u.id === numericId);
    if (selected) {
      setCurrentUser(selected);
    }
  };

  const otherUser = users.find((u) => u.id !== currentUser?.id) || null;

  return (
    <DemoUserContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser,
        selectUser,
        otherUser,
        isLoading,
        error,
        reloadUsers: loadUsers,
      }}
    >
      {children}
    </DemoUserContext.Provider>
  );
}

export function useDemoUser() {
  const context = useContext(DemoUserContext);
  if (!context) {
    throw new Error('useDemoUser must be used within a DemoUserProvider');
  }
  return context;
}

export default DemoUserContext;
