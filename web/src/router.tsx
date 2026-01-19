import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import MainLayout from './layouts/MainLayout';
import EntrepreneurDashboard from './pages/EntrepreneurDashboard';
import EntrepreneurProfile from './pages/EntrepreneurProfile';
import Home from './pages/Home';
import InvestmentDetails from './pages/InvestmentDetails';
import InvestorDashboard from './pages/InvestorDashboard';
import InvestorFeed from './pages/InvestorFeed';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import PaymentCancel from './pages/PaymentCancel';
import PaymentFail from './pages/PaymentFail';
import PaymentSuccess from './pages/PaymentSuccess';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Verify from './pages/Verify';

const rootRoute = createRootRoute({
    component: MainLayout,
});

const homeRoute = createRoute({ path: '/', getParentRoute: () => rootRoute, component: Home });
const loginRoute = createRoute({ path: '/login', getParentRoute: () => rootRoute, component: Login });
const registerRoute = createRoute({ path: '/register', getParentRoute: () => rootRoute, component: Register });
const verifyRoute = createRoute({ path: '/verify', getParentRoute: () => rootRoute, component: Verify });
const forgotPasswordRoute = createRoute({ path: '/forgot-password', getParentRoute: () => rootRoute, component: ForgotPassword });
const resetPasswordRoute = createRoute({ path: '/reset-password', getParentRoute: () => rootRoute, component: ResetPassword });
const feedRoute = createRoute({ path: '/feed', getParentRoute: () => rootRoute, component: InvestorFeed });
const dashboardRoute = createRoute({ path: '/dashboard', getParentRoute: () => rootRoute, component: EntrepreneurDashboard });
const investorDashboardRoute = createRoute({ path: '/investor-dashboard', getParentRoute: () => rootRoute, component: InvestorDashboard });
const campaignRoute = createRoute({ path: '/campaign/$id', getParentRoute: () => rootRoute, component: InvestmentDetails });
const entrepreneurProfileRoute = createRoute({ path: '/profile/$entrepreneurId', getParentRoute: () => rootRoute, component: EntrepreneurProfile });
const notificationsRoute = createRoute({ path: '/notifications', getParentRoute: () => rootRoute, component: Notifications });
const transactionsRoute = createRoute({ path: '/transactions', getParentRoute: () => rootRoute, component: Transactions });
const paymentSuccessRoute = createRoute({ path: '/payment/success', getParentRoute: () => rootRoute, component: PaymentSuccess });
const paymentFailRoute = createRoute({ path: '/payment/fail', getParentRoute: () => rootRoute, component: PaymentFail });
const paymentCancelRoute = createRoute({ path: '/payment/cancel', getParentRoute: () => rootRoute, component: PaymentCancel });
const settingsRoute = createRoute({ path: '/settings', getParentRoute: () => rootRoute, component: Settings });
const notFoundRoute = createRoute({ path: '*', getParentRoute: () => rootRoute, component: NotFound });

const routeTree = rootRoute.addChildren([
    homeRoute,
    loginRoute,
    registerRoute,
    verifyRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    feedRoute,
    dashboardRoute,
    investorDashboardRoute,
    campaignRoute,
    entrepreneurProfileRoute,
    notificationsRoute,
    transactionsRoute,
    paymentSuccessRoute,
    paymentFailRoute,
    paymentCancelRoute,
    settingsRoute,
    notFoundRoute,
]);

const router = createRouter({ routeTree });

export default function AppRouter() {
    return <RouterProvider router={router} />;
}
