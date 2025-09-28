'use client';

import { useUser } from '@clerk/nextjs';
import { createUser, updateUserTheme, getUserTheme } from '@/lib/actions';
import { useEffect, useState, useCallback } from 'react';

export function UserSync() {
  const { user, isLoaded } = useUser();
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (isLoaded && user && !hasSynced) {
      setHasSynced(true);
      
      // Sync user data to database
      createUser(
        user.id,
        user.emailAddresses[0]?.emailAddress || '',
        user.fullName || undefined,
        user.imageUrl || undefined
      ).then(() => {
        // After user is created, sync theme
        return getUserTheme();
      }).then((savedTheme) => {
        // Apply the user's saved theme
        if (savedTheme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
        // Update localStorage to match
        localStorage.setItem('theme', savedTheme);
      }).catch((error) => {
        console.error('Error syncing user:', error);
        // Fallback to localStorage theme
        const localTheme = localStorage.getItem('theme');
        if (localTheme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      });
    }
  }, [isLoaded, user, hasSynced]);

  // Function to update theme in database when user changes it
  const handleThemeChange = useCallback(async (theme: string) => {
    if (user && (theme === 'light' || theme === 'dark')) {
      try {
        await updateUserTheme(theme as 'light' | 'dark');
      } catch (error) {
        console.error('Error updating user theme:', error);
      }
    }
  }, [user]);

  // Expose theme change handler for the theme toggler
  useEffect(() => {
    (window as Window & { updateUserTheme?: (theme: string) => void }).updateUserTheme = handleThemeChange;
    return () => {
      delete (window as Window & { updateUserTheme?: (theme: string) => void }).updateUserTheme;
    };
  }, [user, handleThemeChange]);

  return null; // This component doesn't render anything
}
