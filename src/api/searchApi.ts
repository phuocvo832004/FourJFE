import apiClient from './apiClient';
// import { ProductDocument } from '../types/product'; // Tạm comment
// import { PageResponse } from '../types/api'; // Xóa import
// import { SearchResult, SearchParams, SimpleSearchParams, FacetEntry } from '../types/search';

// --- Type Definitions (Kiểm tra/Bổ sung) ---
type ProductDocument = unknown; // Thêm lại định nghĩa tạm thời
// export interface SearchResult { ... } // Đã có, cần kiểm tra lại trường
// export interface ProductDocument { ... } // Chuyển sang src/types/product.ts?
// export interface SearchParams { ... } // Đã có, kiểm tra lại trường
// export interface SimpleSearchParams { ... } // Đã có


// Endpoint mới cho search API
const searchEndpoints = {
  // SearchController (/api/search)
  searchProductsComplex: '/search/products',
  searchProductsSimple: '/search/products',
  getPriceRange: '/search/products/price-range',
  searchByCategory: (categoryId: string) => `/search/products/category/${categoryId}`,
  filterProducts: '/search/products/filter',
  getSuggestions: '/search/suggestions',

  // Các endpoint khác (có thể không cần ở frontend)
  getIndexStatus: '/search/index-status',
  recreateIndex: '/search/recreate-index',
  indexProduct: '/search/index-product',
  bulkIndexProducts: '/search/bulk-index-products',
  getSearchHealth: '/search/health',
  deleteProductIndex: (id: string) => `/search/product/${id}`,
};


const searchApi = {
  // GET /api/search/products - Tìm kiếm sản phẩm (với yêu cầu tùy chỉnh)
  searchProductsComplex: async (params: SearchParams): Promise<SearchResult> => {
    const { page, from = 0, size = 20 } = params; // Loại bỏ ...restParams vì không sử dụng
    const calculatedFrom = page !== undefined ? page * size : from; // Ưu tiên page nếu có
    
    // Chuyển từ POST sang GET để tránh vấn đề XSRF-TOKEN
    const searchParams = new URLSearchParams();
    
    // Thêm các tham số cơ bản
    searchParams.append('from', calculatedFrom.toString());
    searchParams.append('size', size.toString());
    searchParams.append('includeAggregations', (params.includeAggregations ?? true).toString());
    
    // Thêm query nếu có
    if (params.query) {
      searchParams.append('keyword', params.query);
    } else {
      searchParams.append('keyword', '');
    }
    
    // Thêm categories nếu có
    if (params.categories && params.categories.length > 0) {
      params.categories.forEach(category => {
        searchParams.append('categories', category);
      });
    }
    
    // Thêm sortOption nếu có
    if (params.sortOption) {
      searchParams.append('sortOption', params.sortOption);
    }
    
    // Thêm priceRange nếu có
    if (params.priceRange) {
      if (params.priceRange.min !== undefined) {
        searchParams.append('priceRange.min', params.priceRange.min.toString());
      }
      if (params.priceRange.max !== undefined) {
        searchParams.append('priceRange.max', params.priceRange.max.toString());
      }
    }
    
    // DEBUG: Log URL và params trước khi gửi request
    const requestUrl = `${searchEndpoints.searchProductsComplex}?${searchParams.toString()}`;
    console.log('[DEBUG] Search API Request URL:', requestUrl);
    
    try {
      const response = await apiClient.get(requestUrl);
      // DEBUG: Log response data
      console.log('[DEBUG] Search API Response:', {
        totalHits: response.data.totalHits,
        productsCount: response.data.products ? response.data.products.length : 0,
        facetsKeys: response.data.facets ? Object.keys(response.data.facets) : []
      });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Search API Error:', error);
      throw error;
    }
  },

  // GET /api/search/products - Tìm kiếm sản phẩm theo truy vấn
  searchProductsSimple: async (
    keyword: string,
    page: number = 0,
    size: number = 10,
    params?: Omit<SimpleSearchParams, 'keyword' | 'page' | 'size'> // Thêm các params khác nếu cần
  ): Promise<SearchResult> => {
    const queryParams: SimpleSearchParams = {
      keyword,
      page,
      size,
      ...params, // Spread các params tùy chọn khác
    };
    
    // DEBUG: Log params
    console.log('[DEBUG] Search Simple API Request Params:', queryParams);
    
    try {
      const response = await apiClient.get(searchEndpoints.searchProductsSimple, { params: queryParams });
      console.log('[DEBUG] Search Simple API Response:', {
        totalHits: response.data.totalHits,
        productsCount: response.data.products ? response.data.products.length : 0
      });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Search Simple API Error:', error);
      throw error;
    }
  },

  // GET /api/search/products/price-range - Lấy khoảng giá sản phẩm
  getPriceRange: async (query?: string, categoryId?: string) => {
    // DEBUG: Log params
    console.log('[DEBUG] Get Price Range Request:', { query, categoryId });
    
    try {
      const response = await apiClient.get<{ min: number, max: number }>(searchEndpoints.getPriceRange, { 
        params: { 
          keyword: query,
          categoryId 
        }
      });
      console.log('[DEBUG] Price Range Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Price Range API Error:', error);
      throw error;
    }
  },

  // GET /api/search/products/category/{categoryId} - Tìm kiếm sản phẩm theo danh mục
  searchByCategory: async (
    categoryId: string,
    page: number = 0,
    size: number = 10,
    params?: Omit<SimpleSearchParams, 'categories' | 'page' | 'size'>
  ): Promise<SearchResult> => {
    const queryParams = { page, size, ...params };
    
    // DEBUG: Log params
    console.log('[DEBUG] Search By Category Request:', { categoryId, ...queryParams });
    
    try {
      const response = await apiClient.get(searchEndpoints.searchByCategory(categoryId), { params: queryParams });
      console.log('[DEBUG] Search By Category Response:', {
        totalHits: response.data.totalHits,
        productsCount: response.data.products ? response.data.products.length : 0
      });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Search By Category API Error:', error);
      throw error;
    }
  },

  // GET /api/search/products/filter - Lọc sản phẩm
  filterProducts: async (params: SimpleSearchParams): Promise<SearchResult> => {
    // DEBUG: Log params
    console.log('[DEBUG] Filter Products Request:', params);
    
    try {
      const response = await apiClient.get<SearchResult>(searchEndpoints.filterProducts, { params });
      console.log('[DEBUG] Filter Products Response:', {
        totalHits: response.data.totalHits,
        productsCount: response.data.products ? response.data.products.length : 0
      });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Filter Products API Error:', error);
      throw error;
    }
  },

  // GET /api/search/suggestions - Lấy gợi ý tìm kiếm
  getSuggestions: async (prefix: string, size: number = 5): Promise<string[]> => {
    if (!prefix || prefix.length < 2) return [];
    
    // DEBUG: Log params
    console.log('[DEBUG] Get Suggestions Request:', { prefix, size });
    
    try {
      const response = await apiClient.get<string[]>(searchEndpoints.getSuggestions, { params: { prefix, size } });
      console.log('[DEBUG] Get Suggestions Response:', { 
        count: response.data.length,
        suggestions: response.data
      });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Get Suggestions API Error:', error);
      throw error;
    }
  },

  // Các hàm quản lý index (có thể không cần ở frontend)
  // getIndexStatus: async () => {...},
  // recreateIndex: async () => {...},
  // ...
};

export default searchApi;

// --- Type Definitions --- (Kiểm tra lại với Backend)
export interface SearchResult { // Có thể cần PageResponse<ProductDocument>?
  totalHits: number;
  page: number; // Backend trả về page hay from/size?
  size: number;
  products: ProductDocument[]; // Dùng type tạm unknown
  suggestedTerms?: string[];
  facets?: Record<string, FacetEntry[]>; // Elasticsearch aggregations
  searchTime?: string; // Có trả về không?
}

// Chuyển ProductDocument sang src/types/product.ts
// export interface ProductDocument { ... }

export interface FacetEntry {
  key: string;
  count: number;
}

// Tham số tìm kiếm phức tạp (cho GET)
export interface SearchParams {
  query?: string; // Giữ nguyên tên tham số để tương thích với code hiện tại nhưng nó sẽ được chuyển đổi thành keyword khi gửi đi
  categories?: string[]; // category IDs or names?
  // brand?: string; // Có filter theo brand không?
  priceRange?: {
    min?: number;
    max?: number;
  };
  attributes?: Record<string, string[]>; // { "color": ["Red", "Blue"], "size": ["M"] }
  sortOption?: 'RELEVANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST' | 'BEST_SELLING' | 'HIGHEST_RATED';
  page?: number; // Dùng page hay from?
  from?: number; // Thêm trường from
  size?: number;
  includeAggregations?: boolean;
}

// Tham số tìm kiếm đơn giản (cho GET)
interface SimpleSearchParams {
  keyword: string;
  page: number;
  size: number;
  sortDir?: 'asc' | 'desc'; // Sửa lại từ boolean
  sortBy?: string; // "price", "name", "createdAt"?
  categories?: string[]; // category IDs or names?
  // Thêm các params đơn giản khác nếu có
}

export interface ProductAttribute {
  name: string;
  value: string;
} 