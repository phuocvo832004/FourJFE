import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { getToken } from '../api/setupApiClient';
import { toast } from 'react-hot-toast';
import orderApi, { CreateOrderRequest } from '../api/orderApi';
import { formatCurrency, formatPriceForServer } from '../utils/formatters';
import { useQueryClient } from '@tanstack/react-query';
import { CART_QUERY_KEYS } from '../hooks/useCartMutation';

// Thông tin địa chỉ giao hàng
interface ShippingFormData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  notes: string;
}

// Phương thức thanh toán
type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PAYPAL';

// Component form địa chỉ giao hàng
const CheckoutForm: React.FC<{
  formData: ShippingFormData;
  setFormData: React.Dispatch<React.SetStateAction<ShippingFormData>>;
  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  isSubmitting: boolean;
  onSubmit: () => void;
}> = ({ formData, setFormData, paymentMethod, setPaymentMethod, isSubmitting, onSubmit }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
  <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Thông tin giao hàng</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên người nhận
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Tỉnh/Thành phố
            </label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Chọn Tỉnh/Thành phố</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Hồ Chí Minh">Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Hải Phòng">Hải Phòng</option>
              <option value="Cần Thơ">Cần Thơ</option>
            </select>
          </div>

          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
              Quận/Huyện
            </label>
            <select
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Chọn Quận/Huyện</option>
              <option value="Quận 1">Quận 1</option>
              <option value="Quận 2">Quận 2</option>
              <option value="Quận 3">Quận 3</option>
            </select>
          </div>

          <div>
            <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
              Phường/Xã
            </label>
            <select
              id="ward"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Chọn Phường/Xã</option>
              <option value="Phường Bến Nghé">Phường Bến Nghé</option>
              <option value="Phường Bến Thành">Phường Bến Thành</option>
              <option value="Phường Đa Kao">Phường Đa Kao</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Phương thức thanh toán</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="cod"
              name="paymentMethod"
              type="radio"
              checked={paymentMethod === 'COD'}
              onChange={() => setPaymentMethod('COD')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700">
              Thanh toán khi nhận hàng (COD)
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="bank_transfer"
              name="paymentMethod"
              type="radio"
              checked={paymentMethod === 'BANK_TRANSFER'}
              onChange={() => setPaymentMethod('BANK_TRANSFER')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="bank_transfer" className="ml-3 block text-sm font-medium text-gray-700">
              Chuyển khoản ngân hàng
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="credit_card"
              name="paymentMethod"
              type="radio"
              checked={paymentMethod === 'CREDIT_CARD'}
              onChange={() => setPaymentMethod('CREDIT_CARD')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="credit_card" className="ml-3 block text-sm font-medium text-gray-700">
              Thẻ tín dụng
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="paypal"
              name="paymentMethod"
              type="radio"
              checked={paymentMethod === 'PAYPAL'}
              onChange={() => setPaymentMethod('PAYPAL')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="paypal" className="ml-3 block text-sm font-medium text-gray-700">
              PayPal
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-70"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
        </button>
      </div>
  </div>
);
};

// Component hiển thị tóm tắt đơn hàng
const OrderSummary: React.FC<{
  items: ReturnType<typeof useCart>['items'];
  total: number;
  shippingFee: number;
}> = ({ items, total, shippingFee }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.cartItemId || item.id} className="flex justify-between text-sm">
          <span className="flex-1">{item.productName || item.name} x{item.quantity}</span>
          <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
        </div>
      ))}
    </div>
    
    <div className="border-t border-gray-200 pt-4 space-y-2">
    <div className="flex justify-between">
      <span>Tạm tính</span>
        <span>{formatCurrency(total)}</span>
    </div>
    <div className="flex justify-between">
      <span>Phí vận chuyển</span>
        <span>{formatCurrency(shippingFee)}</span>
    </div>
      <div className="flex justify-between font-semibold text-lg">
      <span>Tổng</span>
        <span>{formatCurrency(total + shippingFee)}</span>
      </div>
    </div>
  </div>
);

// Component chính của trang Checkout
const CheckoutPageContent: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [shippingFee] = useState(30000); // Phí vận chuyển cố định
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [formData, setFormData] = useState<ShippingFormData>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    notes: ''
  });
  
  useEffect(() => {
    const initCheckout = async () => {
      try {
        // Sử dụng getToken từ setupApiClient.ts - đã cấu hình sẵn audience
        const token = await getToken();
        if (!token) {
          console.error('Không lấy được token, cần xác thực lại');
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Auth error:', error);
        setIsInitialized(true);
      }
    };

    initCheckout();
  }, []);

  const handleSubmitOrder = async () => {
    // Kiểm tra dữ liệu
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.district || !formData.ward) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    if (items.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống');
      return;
    }

    try {
      setIsSubmitting(true);

      // Tạo chuỗi địa chỉ đầy đủ
      const fullAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;

      // Tạo dữ liệu đặt hàng
      const orderData: CreateOrderRequest = {
        items: items.map((item) => ({
          productId: Number(item.productId) || 0,
          productName: item.productName || item.name,
          quantity: item.quantity,
          price: Number(formatPriceForServer(item.price)) // Đảm bảo giữ giá với 2 chữ số thập phân
        })),
        shippingAddress: fullAddress,
        paymentMethod: paymentMethod,
        notes: formData.notes
      };

      // Gọi API tạo đơn hàng
      const response = await orderApi.createOrder(orderData);
      
      // Xử lý chuyển hướng dựa vào phương thức thanh toán
      if (paymentMethod !== 'COD') {
        const paymentUrl = response.data.paymentInfo?.checkoutUrl;
        if (paymentUrl) {
          // Xóa giỏ hàng trước khi chuyển hướng
          clearCart();
          queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEYS.cart] });
          
          // Thông báo cho người dùng
          toast.success('Đang chuyển hướng đến trang thanh toán...');
          
          // Chuyển hướng đến trang thanh toán
          window.location.href = paymentUrl;
          return;
        }
      }
      
      // Xử lý cho COD hoặc trường hợp không có URL thanh toán
      toast.success('Đặt hàng thành công!');
      
      // Xóa giỏ hàng sau khi đặt hàng
      clearCart();
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEYS.cart] });
      
      // Chuyển đến trang thông báo thành công
      navigate(`/order-confirmation/${response.data.id}`);
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      
      // Hiển thị thông báo lỗi cho người dùng
      let errorMessage = 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại sau.';
      
      // Cố gắng lấy thông báo lỗi từ response nếu có
      if (error && typeof error === 'object') {
        const err = error as { response?: { data?: { message?: string }, status?: number } };
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-4">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-6">Bạn cần thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Thanh toán</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng & Thanh toán</h2>
          <CheckoutForm 
            formData={formData}
            setFormData={setFormData}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmitOrder}
          />
        </div>
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow">
           <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>
           <OrderSummary items={items} total={total} shippingFee={shippingFee} />
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = withAuthenticationRequired(CheckoutPageContent, {
  onRedirecting: () => <div className="flex justify-center items-center h-screen">Loading Checkout...</div>,
});

export default CheckoutPage; 