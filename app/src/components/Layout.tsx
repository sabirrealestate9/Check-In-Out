import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FolderOpen, 
  FileText, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tenants', label: 'Tenants', icon: Users },
    { path: '/studios', label: 'Studios', icon: Building2 },
    { path: '/drive', label: 'Google Drive', icon: FolderOpen },
    { path: '/policies', label: 'Policies', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0D] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0B0B0D] border-r border-white/10 fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">
            Sabir Amin
          </h1>
          <p className="text-xs text-[#B8B8B8] mt-1">Real Estate LLC SPC</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C9A03F]/10 text-[#C9A03F] border-l-2 border-[#C9A03F]'
                    : 'text-[#B8B8B8] hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}

          {/* Checklist Dropdown */}
          <div className="pt-4">
            <p className="px-4 text-xs font-semibold text-[#B8B8B8] uppercase tracking-wider mb-2">
              Quick Actions
            </p>
            <NavLink
              to="/checklist/check_in"
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C9A03F]/10 text-[#C9A03F]'
                    : 'text-[#B8B8B8] hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">New Check-In</span>
            </NavLink>
            <NavLink
              to="/checklist/check_out"
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C9A03F]/10 text-[#C9A03F]'
                    : 'text-[#B8B8B8] hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">New Check-Out</span>
            </NavLink>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#C9A03F]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#C9A03F]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">{user?.fullName}</p>
                <p className="text-xs text-[#B8B8B8] capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-[#B8B8B8]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10">
              <DropdownMenuItem className="text-[#B8B8B8] focus:text-white focus:bg-white/5">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0B0B0D]/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-bold text-white">Sabir Amin</h1>
            <p className="text-xs text-[#B8B8B8]">Real Estate LLC SPC</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/5"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-white/10 bg-[#0B0B0D]">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-3 px-4 py-3 ${
                    isActive
                      ? 'bg-[#C9A03F]/10 text-[#C9A03F]'
                      : 'text-[#B8B8B8]'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <div className="border-t border-white/10 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-red-400 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
