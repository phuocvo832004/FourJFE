import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ErrorNotification from '../components/ErrorNotification';
import { withAuthenticationRequired, useAuth0 } from '@auth0/auth0-react';
import { orderApi, OrderDto, OrderItemDto } from '../api/orderApi';

// Dữ liệu giả cho useOrderDetail khi hook thực tế chưa tồn tại
function useOrderDetail(orderNumber: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDto | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      setError("Không tìm thấy mã đơn hàng.");
      setLoading(false);
      return;
    }

    const fetchOrderDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Đang tải thông tin đơn hàng với mã: ${orderNumber}`);
        const response = await orderApi.getOrderByNumber(orderNumber);
        console.log("Nhận được dữ liệu đơn hàng:", response.data);
        setOrder(response.data);
      } catch (err: unknown) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
        // Log detailed error information
        if (err instanceof Error) {
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
        }
        
        const apiError = err as { response?: { status: number; data?: { message?: string, error?: string } } };
        if (apiError.response) {
          console.error("Response status:", apiError.response.status);
          console.error("Response data:", apiError.response.data);
          
          if (apiError.response.status === 404) {
            setError(`Không tìm thấy đơn hàng với mã: ${orderNumber}`);
          } else if (apiError.response.status === 403) {
            setError("Bạn không có quyền xem đơn hàng này.");
          } else if (apiError.response.status === 401) {
            setError("Vui lòng đăng nhập lại để xem thông tin đơn hàng.");
          } else {
            setError(`Lỗi khi tải đơn hàng: ${apiError.response.data?.message || 'Vui lòng thử lại sau.'}`);
          }
        } else {
          setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderNumber]);

  const cancelOrder = async () => {
    if (!order || !order.id) {
      setError("Không có thông tin đơn hàng để hủy.");
      return false;
    }
    try {
      await orderApi.cancelOrder(order.id.toString());
      if (orderNumber) {
        const response = await orderApi.getOrderByNumber(orderNumber);
        setOrder(response.data);
      }
      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError("Hủy đơn hàng thất bại. Vui lòng thử lại.");
      return false;
    }
  };

  return { order, loading, error, cancelOrder };
}

const OrderDetailPageContent: React.FC = () => {
  const { id: orderNumberParam } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth0();
  const { order, loading: isLoadingOrder, error, cancelOrder } = useOrderDetail(orderNumberParam);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelOrder = async () => {
    setCancelError(null);
    setSuccessMessage(null);
    try {
      const success = await cancelOrder();
      if (success) {
        setSuccessMessage('Đơn hàng đã được hủy thành công');
      }
    } catch (err) {
      console.error('Error in handleCancelOrder:', err);
      setCancelError('Đã xảy ra lỗi khi thực hiện thao tác hủy.');
    }
  };

  if (isLoadingAuth || isLoadingOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoadingAuth) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-xl text-gray-600 mb-4">Vui lòng đăng nhập để xem chi tiết đơn hàng</p>
          <Link to="/login" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/orders" className="text-blue-600 hover:text-blue-800 mr-4">
            &larr; Quay lại danh sách đơn hàng
          </Link>
          <h1 className="text-3xl font-semibold">Chi tiết đơn hàng</h1>
        </div>
        <ErrorNotification message={error} onClose={() => { /* setError(null) nếu muốn */ }} />
      </div>
    );
  }

  if (!order && !isLoadingOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/orders" className="text-blue-600 hover:text-blue-800 mr-4">
            &larr; Quay lại danh sách đơn hàng
          </Link>
          <h1 className="text-3xl font-semibold">Chi tiết đơn hàng</h1>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-xl text-gray-600">Không tìm thấy thông tin đơn hàng</p>
          <div className="mt-4">
            <button 
              onClick={handleCancelOrder} 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Hủy đơn hàng (Thử nghiệm)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Đóng</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>
      )}
      {cancelError && (
        <ErrorNotification message={cancelError} onClose={() => setCancelError(null)} />
      )}
      
      <div className="flex items-center mb-6">
        <Link to="/orders" className="text-blue-600 hover:text-blue-800 mr-4">
          &larr; Quay lại danh sách đơn hàng
        </Link>
        <h1 className="text-3xl font-semibold">Chi tiết đơn hàng #{order?.orderNumber}</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Thông tin chung</h2>
            <p><strong>Mã đơn hàng:</strong> {order?.orderNumber}</p>
            <p><strong>Trạng thái:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order?.status)}`}>{translateStatus(order?.status)}</span></p>
            <p><strong>Ngày đặt:</strong> {order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</p>
            <p><strong>Tổng tiền:</strong> {order?.totalAmount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
            {order?.notes && <p><strong>Ghi chú:</strong> {order.notes}</p>}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Địa chỉ giao hàng</h2>
            {typeof order?.shippingAddress === 'string' ? (
                <p>{order.shippingAddress}</p>
            ) : (
                <p>{order?.shippingAddress?.address || 'Không có thông tin'}</p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Thông tin thanh toán</h2>
          {order?.paymentInfo ? (
            <>
              <p><strong>Phương thức:</strong> {translatePaymentMethod(order.paymentInfo.paymentMethod)}</p>
              <p><strong>Trạng thái:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.paymentInfo.paymentStatus)}`}>{translatePaymentStatus(order.paymentInfo.paymentStatus)}</span></p>
              {order.paymentInfo.transactionId && <p><strong>Mã giao dịch:</strong> {order.paymentInfo.transactionId}</p>}
              {order.paymentInfo.paymentDate && <p><strong>Ngày thanh toán:</strong> {new Date(order.paymentInfo.paymentDate).toLocaleString()}</p>}
               {order.paymentInfo.checkoutUrl && order.paymentInfo.paymentStatus === 'PENDING' && (
                <a 
                  href={order.paymentInfo.checkoutUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Thanh toán ngay
                </a>
              )}
            </>
          ) : (
            <p>Chưa có thông tin thanh toán.</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Sản phẩm</h2>
          <div className="flow-root">
            <ul role="list" className="-my-6 divide-y divide-gray-200">
              {order?.items?.map((item: OrderItemDto) => (
                <li key={item.productId} className="flex py-6">
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>
                          <Link to={`/products/${item.productId}`}>{item.productName}</Link>
                        </h3>
                        <p className="ml-4">{item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
                      </div>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <p className="text-gray-500">Số lượng: {item.quantity}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {order && (order.status === 'PENDING' || order.status === 'PROCESSING' || order.status === 'CONFIRMED') && (
           <div className="mt-8 border-t pt-6 text-center">
             <button
               onClick={handleCancelOrder}
               disabled={isLoadingOrder || ['CANCELLED', 'COMPLETED', 'DELIVERED', 'SHIPPED'].includes(order.status)}
               className={`px-6 py-3 rounded-md text-white font-semibold
                 ${(isLoadingOrder || ['CANCELLED', 'COMPLETED', 'DELIVERED', 'SHIPPED'].includes(order.status))
                   ? 'bg-gray-400 cursor-not-allowed'
                   : 'bg-red-600 hover:bg-red-700'}`}
             >
               {isLoadingOrder ? 'Đang xử lý...' : 'Hủy đơn hàng'}
             </button>
           </div>
         )}
      </div>
    </div>
  );
};

// Helper functions for status and payment translation/coloring
const translateStatus = (status: string | undefined): string => {
  switch (status) {
    case 'PENDING': return 'Chờ xác nhận';
    case 'CONFIRMED': return 'Đã xác nhận';
    case 'PROCESSING': return 'Đang xử lý';
    case 'SHIPPED': return 'Đang giao hàng';
    case 'DELIVERED': return 'Đã giao';
    case 'COMPLETED': return 'Hoàn thành';
    case 'CANCELLED': return 'Đã hủy';
    case 'RETURNED': return 'Đã trả hàng';
    case 'REFUNDED': return 'Đã hoàn tiền';
    default: return status || 'Không xác định';
  }
};

const getStatusColor = (status: string | undefined): string => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
    case 'PROCESSING': return 'bg-indigo-100 text-indigo-800';
    case 'SHIPPED': return 'bg-purple-100 text-purple-800';
    case 'DELIVERED': return 'bg-teal-100 text-teal-800';
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    case 'RETURNED': return 'bg-orange-100 text-orange-800';
    case 'REFUNDED': return 'bg-pink-100 text-pink-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const translatePaymentMethod = (method: string | undefined): string => {
  switch (method) {
    case 'COD': return 'Thanh toán khi nhận hàng (COD)';
    case 'PAYOS': return 'Thanh toán qua PayOS';
    case 'BANK_TRANSFER': return 'Chuyển khoản ngân hàng';
    default: return method || 'Không xác định';
  }
};

const translatePaymentStatus = (status: string | undefined): string => {
  switch (status) {
    case 'PENDING': return 'Chờ thanh toán';
    case 'PAID': return 'Đã thanh toán';
    case 'FAILED': return 'Thanh toán thất bại';
    case 'CANCELLED': return 'Đã hủy thanh toán';
    case 'REFUNDED': return 'Đã hoàn tiền';
    default: return status || 'Không xác định';
  }
};

const getPaymentStatusColor = (status: string | undefined): string => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'PAID': return 'bg-green-100 text-green-800';
    case 'FAILED': return 'bg-red-100 text-red-800';
    case 'CANCELLED': return 'bg-gray-100 text-gray-800';
    case 'REFUNDED': return 'bg-pink-100 text-pink-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const OrderDetailPage = withAuthenticationRequired(OrderDetailPageContent, {
  onRedirecting: () => <div className="flex justify-center items-center h-screen">Loading Order Details...</div>,
});

export default OrderDetailPage; 