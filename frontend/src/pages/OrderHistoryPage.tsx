import React from 'react';
import { Link } from 'react-router-dom';
import { useUserOrdersQuery } from '../hooks/useOrderQueries';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import RecommendedProducts from '../components/common/RecommendedProducts';

// Helper functions
const formatOrderDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const getStatusText = (status: string): string => {
   const statusMap: Record<string, string> = {
       PENDING: 'Chờ xác nhận',
       PROCESSING: 'Đang xử lý',
       SHIPPED: 'Đang giao hàng',
       DELIVERED: 'Đã giao hàng',
       CANCELLED: 'Đã hủy',
       RETURNED: 'Đã hoàn trả',
   };
   return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'PENDING': return 'bg-yellow-100 text-yellow-800';
        case 'PROCESSING': return 'bg-blue-100 text-blue-800';
        case 'SHIPPED': return 'bg-indigo-100 text-indigo-800';
        case 'DELIVERED': return 'bg-green-100 text-green-800';
        case 'CANCELLED': return 'bg-red-100 text-red-800';
        case 'RETURNED': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const OrderHistoryPageContent: React.FC = () => {
  // Use the hook to fetch orders
  const { data: ordersData, isLoading, error, refetch } = useUserOrdersQuery();
  
  // Adjust based on API response structure
  const orders = ordersData?.orders || [];

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading order history...</div>;
  }

  if (error) {
    return (
       <div className="max-w-7xl mx-auto px-4 py-8 text-center">
         <p className="text-red-500 mb-4">Lỗi khi tải lịch sử đơn hàng: {error.message}</p>
         <button 
           onClick={() => refetch()} 
           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
         >
           Thử lại
         </button>
       </div>
     );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Lịch sử đơn hàng</h1>
        <button 
          onClick={() => refetch()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Làm mới
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-xl text-gray-600 mb-4">Bạn chưa có đơn hàng nào</p>
          <Link to="/products" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                  <div>
                    <p className="text-gray-500">Mã đơn hàng: <span className="font-medium text-gray-900">#{order.orderNumber}</span></p>
                    <p className="text-gray-500">Ngày đặt: <span className="font-medium text-gray-900">{formatOrderDate(order.createdAt)}</span></p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium mb-2">Sản phẩm</h3>
                  <div className="space-y-3">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        {/* Product Info */}
                        <div className="flex-1 mr-4">
                          <p className="font-medium truncate">{item.productName}</p>
                          <p className="text-sm text-gray-500">SL: {item.quantity}</p>
                        </div>
                        {/* Price */}
                        <div className="text-right">
                          <p className="font-medium">{(item.price * item.quantity).toLocaleString()} đ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Order Footer */}
                <div className="border-t border-gray-200 mt-4 pt-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <p className="text-gray-600">Tổng tiền: <span className="font-semibold text-gray-900">{order.totalAmount.toLocaleString()} đ</span></p>
                    {order.paymentInfo && (
                      <p className="text-sm text-gray-600">Thanh toán: <span className="font-medium">{order.paymentInfo.paymentMethod}</span></p>
                    )}
                  </div>
                  <div className="mt-3 md:mt-0 flex space-x-2">
                    <Link 
                      to={`/order/${order.id}`} 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* TODO: Pagination Controls */}
      {/* {totalPages > 1 && orders.length > 0 && ( ... pagination ... ) } */}

      <div className="mt-12">
        <RecommendedProducts
          maxProducts={4}
          title="Sản phẩm bạn có thể quan tâm dựa trên lịch sử mua hàng"
        />
      </div>
    </div>
  );
};

const OrderHistoryPage = withAuthenticationRequired(OrderHistoryPageContent, {
  onRedirecting: () => <div className="flex justify-center items-center h-screen">Loading Orders...</div>,
});

export default OrderHistoryPage;