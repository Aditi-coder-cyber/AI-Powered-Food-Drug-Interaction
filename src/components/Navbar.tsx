import React from 'react';
import { Shield, Home, Search, Clock, User, BookOpen, Activity, LogOut } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface User {
  name: string;
  email: string;
  isGuest: boolean;
}

interface NavbarProps {
  user: User | null;
  currentPage?: string;
  onNavigate: (page: any) => void;
  onLogout?: () => void;
}

export function Navbar({ user, currentPage, onNavigate, onLogout }: NavbarProps) {
  const navItems = user && !user.isGuest ? [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'check', label: 'New Check', icon: Search },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'trust', label: 'Trust Panel', icon: Activity },
  ] : user && user.isGuest ? [
    { id: 'check', label: 'Check', icon: Search },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'trust', label: 'Trust Panel', icon: Activity },
  ] : [];

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate(user && !user.isGuest ? 'dashboard' : 'landing')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Shield className="size-8 text-blue-600" />
            <span className="font-semibold text-xl text-gray-900 hidden sm:inline">SafeMed AI</span>
          </button>

          {/* Navigation Items */}
          <div className="flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className="size-5" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Language Switcher + User Menu */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="w-px h-6 bg-gray-200" /> {/* separator */}
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <User className="size-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user.name}</span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="size-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Login
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
