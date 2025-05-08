import React, { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
// import LoadingSpinner from '../components/ui/LoadingSpinner'; // Assuming path

interface RoleBasedGuardProps {
  requiredRole: string;
  children: ReactNode;
}

const RoleBasedGuard: React.FC<RoleBasedGuardProps> = ({ requiredRole, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    // Use text for now
    return <div className="flex justify-center items-center h-screen">Checking permissions...</div>;
  }

  if (!isAuthenticated) {
    // Should be handled by withAuthenticationRequired, but as a fallback
    return <Navigate to="/login" replace />;
  }

  // --- Role Check ---
  // Adjust the claim namespace and property according to your Auth0 setup
  // Make sure you have configured Auth0 Rules or Actions to add roles to the ID or Access Token
  // Example namespace: https://fourjshop.com/roles
  const namespace = 'https://fourjshop.com/'; // Replace with your actual namespace
  const roles = user?.[`${namespace}roles`] as string[] | undefined;

  if (!roles || !roles.includes(requiredRole.toUpperCase())) { // Assuming roles are uppercase in token
    console.warn(`User does not have required role: ${requiredRole}. Available roles:`, roles);
    // Redirect to an unauthorized page or home page
    return <Navigate to="/unauthorized" replace />; // Ensure you have an Unauthorized page
  }

  // User has the required role, render the children
  return <>{children}</>;
};

export default RoleBasedGuard; 