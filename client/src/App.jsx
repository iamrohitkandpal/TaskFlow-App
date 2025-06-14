import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Tasks from "./pages/Tasks";
import Users from "./pages/Users";
import Trash from "./pages/Trash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TaskDetails from "./pages/TaskDetails";
import { Toaster, toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { Fragment, useEffect, useRef } from "react";
import { setIsSidebarOpen, setCredentials, logout } from "./redux/slices/authSlice";
import { Transition } from "@headlessui/react";
import clsx from "clsx";
import { IoClose } from "react-icons/io5";
import Settings from "./pages/Settings";
import socket, { initializeSocket, disconnectSocket } from "./services/socketService";
import Reports from "./pages/Reports";
import ErrorBoundary from "./components/ErrorBoundary";
import PrivateRoute from "./components/PrivateRoute";
import IntegrationsSettings from "./pages/IntegrationsSettings";
import OAuthCallback from "./components/integrations/OAuthCallback";
import ProjectTimeline from "./pages/ProjectTimeline";
import NetworkStatus from "./components/NetworkStatus";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Layout() {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  return user ? (
    <div className="w-full h-screen flex flex-col md:flex-row">
      <div className="w-1/5 h-screen bg-white sticky top-0 hidden md:block">
        <Sidebar />
      </div>
      <MobileSidebar />
      <div className="flex-1 overflow-y-auto">
        <Navbar />
        <div className="p-4 2xl:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

const MobileSidebar = () => {
  const { isSidebarOpen } = useSelector((state) => state.auth);
  const mobileMenuRef = useRef(null);
  const dispatch = useDispatch();

  const closeSidebar = () => {
    dispatch(setIsSidebarOpen(false));
  };

  return (
    <Transition
      show={isSidebarOpen}
      as={Fragment}
      enter="transition-opacity duration-700 ease-out"
      enterFrom="opacity-0 -translate-x-full"
      enterTo="opacity-100 translate-x-0"
      leave="transition-opacity duration-700 ease-in-out"
      leaveFrom="opacity-100 translate-x-0"
      leaveTo="opacity-0 -translate-x-full"
    >
      <div
        ref={mobileMenuRef}
        className="fixed inset-0 z-50 md:hidden bg-black/40"
        onClick={closeSidebar}
      >
        <div
          className="relative bg-white w-3/4 h-screen transform transition-transform duration-300 ease-in-out"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
        >
          <div className="w-full flex justify-end px-5 py-0">
            <button
              onClick={closeSidebar}
              className="absolute flex justify-end items-center mt-6"
            >
              <IoClose size={25} />
            </button>
          </div>
          <div>
            <Sidebar />
          </div>
        </div>
      </div>
    </Transition>
  );
};

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);

  useEffect(() => {
    // Check for existing token on app load
    const storedToken = localStorage.getItem(AUTH_TOKEN_NAME);
    const storedUser = localStorage.getItem('userInfo');
    
    if (storedToken && storedUser) {
      dispatch(setCredentials({
        token: storedToken,
        user: JSON.parse(storedUser)
      }));
    }
  }, [dispatch]);

  // Initialize socket if authenticated
  useEffect(() => {
    if (token) {
      initializeSocket(token);
    }
  }, [token]);

  return (
    <ErrorBoundary>
      <main className="w-full min-h-screen bg-[#f3f4f6]">
        <Routes>
          <Route element={<Layout />}>
            <Route index path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/completed/:status" element={<Tasks />} />
            <Route path="/in-progress/:status" element={<Tasks />} />
            <Route path="/todo/:status" element={<Tasks />} />
            <Route path="/team" element={<Users />} />
            <Route path="/trashed" element={<Trash />} />
            <Route path="/task/:id" element={<TaskDetails />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/integrations" element={<PrivateRoute><IntegrationsSettings /></PrivateRoute>} />
            <Route path="/settings/integrations/:provider/callback" element={<PrivateRoute><OAuthCallback /></PrivateRoute>} />
            <Route path="/projects/:projectId/timeline" element={<ProjectTimeline />} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          </Route>

          <Route path="/login" element={<Login />} />
        </Routes>

        <Toaster richColors />
        <NetworkStatus />
      </main>
    </ErrorBoundary>
  );
}

export default App;
