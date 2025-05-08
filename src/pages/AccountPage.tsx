import React from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Tab } from '@headlessui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import ProfileTab from '../components/account/ProfileTab';
import SecurityTab from '../components/account/SecurityTab';
import Auth0Tab from '../components/account/Auth0Tab';
import { UseMutationResult } from '@tanstack/react-query';

// Helper function for class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Loading component (simple text for now)
const LoadingSpinnerComponent = () => (
  <div className="flex justify-center items-center py-12">Loading...</div>
);

// Mock types until imports are available
interface UserProfile {
  id: string;
  auth0Id: string;
  username: string;
  email: string;
  phone: string;
  name: string;
  fullName: string;
  avatarUrl: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

// Profile tab props interface
interface ProfileTabProps {
  user: User;
  userProfile: UserProfile;
  updateProfileMutation: UseMutationResult<unknown, unknown, UpdateProfileData, unknown>;
  setSuccessMessage: (message: string) => void;
  setErrorMessage: (message: string) => void;
}

const AccountPageContent: React.FC = () => {
  const { user: auth0User, isLoading: auth0Loading } = useAuth0();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState(0);

  // Mock user profile data until API is connected
  const userProfile: UserProfile = {
    id: '1',
    auth0Id: auth0User?.sub || '',
    username: auth0User?.name || '',
    email: auth0User?.email || '',
    phone: '',
    name: auth0User?.name || '',
    fullName: auth0User?.name || '',
    avatarUrl: auth0User?.picture || '',
    address: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mock loading states
  const profileLoading = false;
  const profileError = null;
  
  const handleProfileUpdate = (data: UpdateProfileData) => {
    console.log("Profile update requested:", data);
    // Implement when API is ready
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  // Create a mock mutation result that matches UseMutationResult
  const updateProfileMutation = {
    mutate: handleProfileUpdate,
    isPending: false,
    isIdle: true,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    mutateAsync: async (data: UpdateProfileData) => {
      handleProfileUpdate(data);
      return undefined;
    },
    reset: () => {},
    status: 'idle' as const,
    failureCount: 0,
    failureReason: null,
    variables: undefined,
    context: undefined,
    isPaused: false,
    submittedAt: 0
  } as UseMutationResult<unknown, unknown, UpdateProfileData, unknown>;

  if (auth0Loading || profileLoading) {
    return <LoadingSpinnerComponent />;
  }

  if (profileError) {
    return <div className="text-red-500">Lỗi tải thông tin tài khoản</div>;
  }

  // Props for ProfileTab
  const profileTabProps: ProfileTabProps = {
    user: auth0User || { name: '', email: '', picture: '', sub: '' },
    userProfile: userProfile,
    updateProfileMutation,
    setSuccessMessage: (message: string) => console.log(message),
    setErrorMessage: (message: string) => console.error(message)
  };

  return (
     <div className="container mx-auto px-4 py-8 max-w-4xl">
       <h1 className="text-3xl font-bold mb-6">Tài khoản của tôi</h1>
       <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
         <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {['Hồ sơ', 'Bảo mật', 'Xác thực Auth0'].map((category) => (
             <Tab
               key={category}
               className={({ selected }) =>
                 classNames(
                   'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                   'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                   selected
                     ? 'bg-white text-blue-700 shadow'
                     : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                 )
               }
             >
               {category}
             </Tab>
           ))}
         </Tab.List>
         <Tab.Panels className="mt-2 bg-white rounded-lg shadow-md overflow-hidden">
            <Tab.Panel className="p-6 outline-none ring-0">
             {userProfile ? <ProfileTab {...profileTabProps} /> : <LoadingSpinnerComponent />}
           </Tab.Panel>
           <Tab.Panel className="p-6 outline-none ring-0">
             <SecurityTab user={auth0User} />
           </Tab.Panel>
           <Tab.Panel className="p-6 outline-none ring-0">
             <Auth0Tab user={auth0User} />
           </Tab.Panel>
         </Tab.Panels>
       </Tab.Group>
     </div>
  );
};

const AccountPage = withAuthenticationRequired(AccountPageContent, {
  onRedirecting: () => <LoadingSpinnerComponent />,
});

export default AccountPage;