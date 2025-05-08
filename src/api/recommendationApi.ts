import apiClient from './apiClient';

// Interface cho các tham số yêu cầu gợi ý
interface RecommendationParams {
  limit?: number;
}

// Các endpoint của recommendation service
const recommendationEndpoints = {
  getUserRecommendations: (userId: string) => `/v1/recommendations/${userId}`,
};

// API functions
const recommendationApi = {
  /**
   * Lấy danh sách sản phẩm được gợi ý cho người dùng dựa trên lịch sử mua hàng
   * @param userId - ID của người dùng
   * @param params - Các tham số tùy chọn
   * @returns Danh sách ID sản phẩm được gợi ý
   */
  getUserRecommendations: async (userId: string, params: RecommendationParams = {}) => {
    try {
      const response = await apiClient.get<number[]>(
        recommendationEndpoints.getUserRecommendations(userId),
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return []; // Trả về mảng rỗng nếu có lỗi
    }
  }
};

export default recommendationApi; 