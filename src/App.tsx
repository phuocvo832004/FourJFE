import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ApiProvider } from './api/ApiProvider';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import AccountPage from './pages/AccountPage';
import CheckoutPage from './pages/CheckoutPage';
import CartPage from './pages/CartPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import RoleBasedGuard from './auth/RoleBasedGuard';
import LoginPage from './pages/LoginPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ContactPage from './pages/ContactPage';
import PaymentResultPage from './pages/PaymentResultPage';
import ImageUploadExample from './pages/ImageUploadExample';
import { useAuth0 } from '@auth0/auth0-react';
import { setupAuthInterceptor } from './api/setupApiClient';
import { setupAuthService } from './auth/auth-service';
import Footer from './components/layout/Footer';
import CallbackPage from './pages/CallbackPage';
import { CART_QUERY_KEYS } from './hooks/useCartMutation';

// Admin pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Seller pages
import SellerLayout from './components/seller/SellerLayout';
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import SellerProductAddPage from './pages/seller/SellerProductAddPage';
import SellerProductEditPage from './pages/seller/SellerProductEditPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerOrderDetailPage from './pages/seller/SellerOrderDetailPage';
import SellerAnalyticsPage from './pages/seller/SellerAnalyticsPage';
import SellerSettingsPage from './pages/seller/SellerSettingsPage';
import SellerRegistrationPage from './pages/seller/SellerRegistrationPage';
import SellerPendingPage from './pages/seller/SellerPendingPage';

const Application = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Làm mới cache giỏ hàng khi đến trang kết quả thanh toán
  useEffect(() => {
    if (location.pathname === '/payment-result') {
      // Khi đến trang kết quả thanh toán, làm mới cache giỏ hàng
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEYS.cart] });
    }
  }, [location.pathname, queryClient]);

  return (
    <ApiProvider>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="callback" element={<CallbackPage />} />
            <Route path="unauthorized" element={<UnauthorizedPage />} />
            <Route path="seller/register" element={<SellerRegistrationPage />} />
            <Route path="seller/pending" element={<SellerPendingPage />} />
            <Route path="payment-result" element={<PaymentResultPage />} />
            <Route path="image-upload-example" element={<ImageUploadExample />} />
            
            <Route path="account" element={<AccountPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrderHistoryPage />} />
            <Route path="order/:id" element={<OrderDetailPage />} />
            <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          
          <Route path="/admin" element={
              <RoleBasedGuard requiredRole="ADMIN">
                <AdminLayout />
              </RoleBasedGuard>
            }>
              <Route index element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          
          <Route path="/seller" element={
              <RoleBasedGuard requiredRole="SELLER">
                <SellerLayout />
              </RoleBasedGuard>
            }>
              <Route index element={<SellerDashboardPage />} />
              <Route path="dashboard" element={<SellerDashboardPage />} />
              <Route path="products" element={<SellerProductsPage />} />
              <Route path="products/add" element={<SellerProductAddPage />} />
              <Route path="products/edit/:id" element={<SellerProductEditPage />} />
              <Route path="orders" element={<SellerOrdersPage />} />
              <Route path="orders/:id" element={<SellerOrderDetailPage />} />
              <Route path="analytics" element={<SellerAnalyticsPage />} />
              <Route path="settings" element={<SellerSettingsPage />} />
          </Route>
        </Routes>
      </QueryClientProvider>
    </ApiProvider>
  );
};

function App() {
  const {
    isLoading,
    error,
    getAccessTokenSilently,
    logout,
    user
  } = useAuth0();

  useEffect(() => {
    setupAuthInterceptor(getAccessTokenSilently, logout, user);
    setupAuthService(getAccessTokenSilently, logout);
  }, [getAccessTokenSilently, logout, user]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">Oops... {error.message}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
          },
          success: {
            style: {
              background: '#E6F4EA',
              border: '1px solid #1A8754',
            },
          },
          error: {
            style: {
              background: '#FADEDE',
              border: '1px solid #DC3545',
            },
          },
        }}
      />
      <main className="flex-grow">
        <React.Suspense fallback={<div className="text-center py-10">Loading Page...</div>}>
          <Application />
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
