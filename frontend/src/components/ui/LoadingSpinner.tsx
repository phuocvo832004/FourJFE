import { memo } from 'react';

const LoadingSpinner = memo(() => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ));
export default LoadingSpinner