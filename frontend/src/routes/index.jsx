import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout'
import AdminDashboard from '../pages/AdminDashboard'
import AdminSettings from '../pages/AdminSettings'
import AdminUsers from '../pages/AdminUsers'
import Auth from '../pages/Auth'
import ChangePassword from '../pages/ChangePassword'
import ForgotPassword from '../pages/ForgotPassword'
import Home from '../pages/Home'
import MyPayments from '../pages/MyPayments'
import Notifications from '../pages/Notifications'
import Profile from '../pages/Profile'
import ResetPassword from '../pages/ResetPassword'
import VerifyEmail from '../pages/VerifyEmail'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Auth mode="login" /> },
      { path: 'register', element: <Auth mode="register" /> },
      { path: 'verify-email', element: <VerifyEmail /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      {
        path: 'me',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'me/change-password',
        element: (
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        ),
      },
      {
        path: 'me/payments',
        element: (
          <ProtectedRoute>
            <MyPayments />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/dashboard',
        element: (
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute adminOnly>
            <AdminUsers />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/settings',
        element: (
          <ProtectedRoute adminOnly>
            <AdminSettings />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <Home /> },
    ],
  },
])
