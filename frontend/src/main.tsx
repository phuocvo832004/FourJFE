import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/store'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
// Import cấu hình axios
import './utils/axios-config'

// Tạo Client cho React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      gcTime: 30 * 60 * 1000, // 30 phút (thay thế cho cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Chỉ import DevTools trong development mode
const ReactQueryDevtools = 
  import.meta.env.MODE === 'development' 
  ? React.lazy(() => 
      import('@tanstack/react-query-devtools').then(module => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : () => null;

// Replace with your Auth0 configuration
const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-vihsigx84vhn1zvg.us.auth0.com';
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'Jeja5neKhzTZiMSLNyDd1wGCKSWWIeGa';
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE || 'http://localhost:80'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Auth0Provider
            domain={auth0Domain}
            clientId={auth0ClientId}
            authorizationParams={{
              redirect_uri: `${window.location.origin}/callback`,
              audience: auth0Audience,
              scope: "openid profile email offline_access"
            }}
            cacheLocation="localstorage"
          >
            <App />
          </Auth0Provider>
        </BrowserRouter>
        <Suspense fallback={null}>
          <ReactQueryDevtools />
        </Suspense>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
