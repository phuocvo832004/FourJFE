/**
 * Định dạng số thành string với định dạng tiền tệ Việt Nam (VND)
 * @param value - Số cần định dạng
 * @returns Chuỗi đã định dạng (ví dụ: 1.234.567₫)
 */

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(value);
};

/**
 * Định dạng số thành số với đúng giá trị không làm tròn
 * @param value - Số cần định dạng
 * @returns Số đã định dạng giữ nguyên giá trị
 */
export const formatDecimal = (value: number): number => {
  return value;
};

/**
 * Định dạng giá để gửi lên server, giữ nguyên giá trị không làm tròn
 * @param value - Giá cần định dạng
 * @returns Số giá giữ nguyên giá trị
 */
export const formatPriceForServer = (value: number): number => {
  return value;
};

/**
 * Định dạng ngày giờ theo format Việt Nam, sử dụng ngày giờ chính xác từ database
 * @param dateString - Chuỗi ngày cần định dạng
 * @returns Chuỗi ngày giờ đã định dạng (ví dụ: 31/12/2023 23:59)
 */
export const formatDateTime = (dateString: string): string => {
  try {
    if (!dateString) return '';
    
    // Tạo đối tượng Date từ chuỗi ISO
    const date = new Date(dateString);
    
    // Bù 7 giờ cho múi giờ Việt Nam (UTC+7)
    const vietnamDate = new Date(date.getTime() - (7 * 60 * 60 * 1000));
    
    return vietnamDate.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Lỗi định dạng ngày:', error);
    return dateString || '';
  }
};

/**
 * Định dạng ngày theo format Việt Nam
 * @param dateString - Chuỗi ngày cần định dạng
 * @returns Chuỗi ngày đã định dạng (ví dụ: 31/12/2023)
 */
export const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return '';
    
    // Tạo đối tượng Date từ chuỗi ISO
    const date = new Date(dateString);
    
    // Bù 7 giờ cho múi giờ Việt Nam (UTC+7)
    const vietnamDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    
    return vietnamDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Lỗi định dạng ngày:', error);
    return dateString || '';
  }
}; 