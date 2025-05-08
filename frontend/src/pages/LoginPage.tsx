import { useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const LoadingSpinner = memo(() => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
));
const LoginPage = () => {
  const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && !isLoading) {
      const redirectTo = localStorage.getItem('redirect_after_login') || '/';
      localStorage.removeItem('redirect_after_login'); // Clean up
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Handle Auth0 login errors
  useEffect(() => {
    if (error) {
      console.error("Auth0 Login Error:", error);
      // Optionally display a user-friendly error message
    }
  }, [error]);


  const handleLogin = async () => {
    try {
      // Store the intended destination before redirecting
      // Note: Auth0's appState can also be used for this
      // localStorage.setItem('redirect_after_login', window.location.pathname); // Or where they should go

      await loginWithRedirect({
        // You can pass application-specific state here if needed
        // appState: { returnTo: window.location.pathname }
      });
    } catch (err) {
      console.error("Error initiating login:", err);
      // Handle errors initiating login (e.g., configuration issues)
    }
  };

  if (isLoading) {
    return <LoadingSpinner />; // Show loading state
  }

  // If authenticated, this component potentially redirects, otherwise show login button
  if (isAuthenticated) {
     return <LoadingSpinner />; // Or null, or redirect confirmation
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full mx-auto my-10 p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">Đăng nhập</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            Đã xảy ra lỗi trong quá trình đăng nhập: {error.message}
          </div>
        )}
        <p className="mb-6 text-gray-600">
          Bạn cần đăng nhập để tiếp tục. Nhấn nút bên dưới để đăng nhập hoặc đăng ký.
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out disabled:opacity-50"
        >
          {isLoading ? 'Đang xử lý...' : 'Đăng nhập / Đăng ký'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage; 