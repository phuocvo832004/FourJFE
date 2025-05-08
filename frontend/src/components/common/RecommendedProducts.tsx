import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { recommendationApi, productApi } from '../../api';
import { Product } from '../../types';
import ProductCard from './ProductCard';

interface RecommendedProductsProps {
  maxProducts?: number;
  title?: string;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  maxProducts = 4,
  title = 'Gợi ý cho bạn'
}) => {
  const { user, isAuthenticated } = useAuth0();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isAuthenticated || !user?.sub) {
        return;
      }

      setLoading(true);
      try {
        // Trích xuất user ID từ Auth0 user sub
        const userId = user.sub.split('|')[1];
        
        // Lấy các sản phẩm được gợi ý từ recommendation service
        const recommendedProductIds = await recommendationApi.getUserRecommendations(userId);
        
        if (recommendedProductIds.length === 0) {
          setHasRecommendations(false);
          return;
        }
        
        // Lấy thông tin chi tiết về các sản phẩm được gợi ý
        const productDetails: Product[] = [];
        
        // Giới hạn số lượng sản phẩm hiển thị
        const limitedIds = recommendedProductIds.slice(0, maxProducts);
        
        // Lấy thông tin cho từng sản phẩm
        for (const id of limitedIds) {
          try {
            const product = await productApi.getPublicProductById(id.toString());
            if (product) {
              productDetails.push(product);
            }
          } catch (err) {
            console.error(`Error fetching product ${id}:`, err);
          }
        }
        
        setProducts(productDetails);
        setHasRecommendations(productDetails.length > 0);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setHasRecommendations(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [isAuthenticated, user, maxProducts]);

  // Không hiển thị component nếu không có đề xuất
  if (!hasRecommendations || !isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-gray-100 py-8 px-4 rounded-lg my-8">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                category={product.category}
              />
            ))}
          </div>
          
          {products.length > 0 && (
            <div className="text-center mt-6">
              <Link 
                to="/products" 
                className="inline-block bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Xem thêm sản phẩm
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendedProducts; 