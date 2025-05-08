import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, UserIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth0 } from '@auth0/auth0-react';
import { CartItem } from '../../types';
import logoImage from '../../assets/logo.jpg';
import SearchBar from '../common/SearchBar';
import { useCart } from '../../hooks/useCart';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { items, toggleCart } = useCart();
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    loginWithRedirect,
    logout 
  } = useAuth0();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  const cartItemsCount = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
    closeUserMenu();
  };

  const handleLogin = () => {
    loginWithRedirect();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isUserMenuOpen && 
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo and desktop menu */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img
                className="h-10 w-auto rounded-sm"
                src={logoImage}
                alt="FourJ Shop"
              />
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                to="/"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900 hover:border-gray-300"
              >
                Home
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Products
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Categories
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Mobile menu button, search, and cart */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 mr-2"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => toggleCart()}
              className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 mr-2 relative"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Icons on Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <SearchBar className="hidden lg:block" />
            
            <button
              onClick={() => toggleCart()}
              className="text-gray-700 hover:text-gray-900 relative p-2 rounded-md hover:bg-gray-100"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
            
            {isLoading ? (
              <div className="h-8 w-8 rounded-full animate-pulse bg-gray-200"></div>
            ) : isAuthenticated ? (
              <div className="relative">
                <button 
                  ref={userButtonRef}
                  onClick={toggleUserMenu} 
                  className="flex items-center focus:outline-none p-1 rounded-full hover:bg-gray-100"
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                >
                  {user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt={user.name || 'User'} 
                      className="h-8 w-8 rounded-full object-cover" 
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  )}
                </button>
                {isUserMenuOpen && (
                  <div 
                    ref={userMenuRef}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5"
                    role="menu"
                  >
                    <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => { closeUserMenu(); navigate('/account'); }}
                      role="menuitem"
                    >
                      Tài khoản
                    </button>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => { closeUserMenu(); navigate('/orders'); }}
                      role="menuitem"
                    >
                      Đơn hàng
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar (toggleable) */}
        {isSearchVisible && (
          <div className="pt-2 pb-3 md:hidden">
            <SearchBar className="w-full" />
          </div>
        )}

        {/* Mobile Menu (toggleable) */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-2 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
              <Link to="/products" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
              <Link to="/categories" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100" onClick={() => setIsMobileMenuOpen(false)}>Categories</Link>
              <Link to="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
              
              <hr className="my-1 border-gray-200" />
              
              <div className="px-3 py-2">
                <button
                  onClick={() => {
                    toggleCart();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center text-gray-700 hover:text-gray-900 w-full text-left"
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  <span>Giỏ hàng</span>
                  {cartItemsCount > 0 && (
                    <span className="ml-auto bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              </div>
              
              <hr className="my-1 border-gray-200" />
              {isLoading ? (
                <div className="px-3 py-2 text-gray-500">Loading...</div>
              ) : isAuthenticated ? (
                <>
                  <Link 
                    to="/account" 
                    className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tài khoản
                  </Link>
                  <Link 
                    to="/orders" 
                    className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Đơn hàng
                  </Link>
                  <button 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-800 hover:bg-gray-100 rounded-md"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { handleLogin(); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-gray-100 rounded-md"
                >
                  Đăng nhập / Đăng ký
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 