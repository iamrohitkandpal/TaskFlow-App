import React, { useEffect } from "react";
import {
  MdAdminPanelSettings,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { Navigate, useNavigate } from "react-router-dom";

import { LuClipboardPen } from "react-icons/lu";
import { FaNewspaper, FaUsers } from "react-icons/fa";
import { FaArrowsToDot } from "react-icons/fa6";
import moment from "moment";
import clsx from "clsx";
import Chart from "../components/Chart";
import { BGS, getInitials, PRIOTITYSTYELS, TASK_TYPE } from "../utils";
import UserInfo from "../components/UserInfo";
import { 
  useGetDashboardStatsQuery,
  useGetProductivityDataQuery 
} from "../redux/slices/api/analyticsApiSlice";
import Loader from "./../components/Loader";
import ActivityFeed from "../components/ActivityFeed";
import PrioritizedTaskList from '../components/PrioritizedTaskList';
import { useSelector } from "react-redux";

const TaskHeader = () => (
  <thead className="border-b border-gray-300">
    <tr className="text-black text-left">
      <th className="py-2">Title</th>
      <th className="py-2">Priority</th>
      <th className="py-2">Team</th>
      <th className="py-2 hidden md:block">Created</th>
    </tr>
  </thead>
);

const TaskTable = ({ tasks }) => {
  const ICONS = {
    high: <MdKeyboardDoubleArrowUp />,
    medium: <MdKeyboardArrowUp />,
    normal: <MdKeyboardArrowDown />,
  };

  const TableRow = ({ task }) => (
    <tr className="border-b border-gray-300 text-gray-600 hover:bg-gray-300/10">
      <td className="py-2">
        <div className="flex items-center gap-2">
          <div
            className={clsx("w-4 h-4 rounded-full", TASK_TYPE[task.stage])}
          />

          <p className="text-base text-[0.90rem] text-black">{task.title}</p>
        </div>
      </td>

      <td className="py-2">
        <div className="flex items-center gap-1">
          <span className={clsx("text-lg", PRIOTITYSTYELS[task.priority])}>
            {ICONS[task.priority]}
          </span>
          <span className="capitalize text-base text-[0.90rem]">
            {task.priority}
          </span>
        </div>
      </td>

      <td className="py-2">
        <div className="flex">
          {task.team.map((m, index) => (
            <div
              key={index}
              className={clsx(
                "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
                BGS[index % BGS.length]
              )}
            >
              <UserInfo user={m} />
            </div>
          ))}
        </div>
      </td>

      <td className="py-2 hidden md:block">
        <span className="text-base text-[0.90rem] text-gray-600">
          {moment(task?.date).fromNow()}
        </span>
      </td>
    </tr>
  );

  return (
    <>
      <div className="w-full lg:w-2/3 md:1/3 bg-white px-2 md:px-4 pt-4 pb-4 shadow-md rounded">
        <table className="w-full mb-5">
          <TaskHeader />
          <tbody>
            {tasks?.map((task, id) => (
              <TableRow key={id} task={task} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const UserTable = ({ users }) => {
  const TableHeader = () => (
    <thead className="border-b border-gray-300">
      <tr className="text-black text-left">
        <th className="py-2">Name</th>
        <th className="py-2">Status</th>
        <th className="py-2">Joined</th>
      </tr>
    </thead>
  );

  const TableRow = ({ user }) => (
    <tr className="border-b border-gray-200 text-gray-600 hover:bg-gray-400/10">
      <td className="py-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full text-white flex items-center justify-center bg-violet-700 text-sm">
            <span className="text-center">{getInitials(user?.name)}</span>
          </div>

          <div className="flex flex-col">
            <p className="text-base text-[0.90rem] text-black">{user?.name}</p>
            <span className="text-xs text-gray-700">{user?.role}</span>
          </div>
        </div>
      </td>

      <td>
        <p
          className={clsx(
            "text-sm w-fit px-3 py-1 rounded-full",
            user?.isActive ? "bg-blue-200" : "bg-yellow-100"
          )}
        >
          {user?.isActive ? "Active" : "Inactive"}
        </p>
      </td>

      <td className="py-2 text-sm">{moment(user?.createdAt).fromNow()}</td>
    </tr>
  );

  return (
    <div className="w-full md:w-2/3 lg:w-1/3 bg-white h-fit px-2 md:px-6 py-4 shadow-md rounded">
      <table className="w-full mb-5">
        <TableHeader />
        <tbody>
          {users?.map((user, index) => (
            <TableRow key={index + user?._id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ActivityItem = ({ user, action, task, time }) => (
  <div className="flex items-center space-x-2">
    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
      {user[0]}
    </div>
    <div>
      <p className="text-sm">
        <span className="font-medium">{user}</span> {action} <span className="font-medium">{task}</span>
      </p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </div>
);

const StatisticsSection = () => {
  const { data: dashboardData, error: dashboardError, isLoading: isLoadingDashboard } = useGetDashboardStatsQuery();

  if (dashboardError) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-500">Failed to load statistics. Please refresh.</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded" 
          onClick={() => dispatch(apiSlice.util.invalidateTags(['DashboardStats']))}>
          Retry
        </button>
      </div>
    );
  }
  
  if (isLoadingDashboard) return <Loader />;
  
  // Render dashboard stats
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {dashboardData?.stats.map(({ icon, bg, label, total }, index) => (
        <Card key={index} icon={icon} bg={bg} label={label} count={total} />
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { data: productivityData, error: productivityError, isLoading: isLoadingProductivity } = useGetProductivityDataQuery();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to login if no token
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isLoadingProductivity) {
    return <Loader />;
  }
  
  if (productivityError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 mb-2">Error loading productivity data</p>
        <p className="text-sm text-gray-600">{productivityError.message || "Please try again later"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StatisticsSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded-md shadow-sm">
            <h4 className="text-lg font-semibold mb-2">Task Status</h4>
            <div className="h-[300px]">
              <Chart data={productivityData?.stats || []} />
            </div>
          </div>
          
          <div className="mt-4">
            <PrioritizedTaskList limit={5} />
          </div>
          
          <div className="mt-4 bg-white p-4 rounded-md shadow-sm">
            <h4 className="text-lg font-semibold mb-4">Recent Tasks</h4>
            <div className="overflow-auto">
              <table className="min-w-full">
                <TaskHeader />
                <TaskTable tasks={productivityData?.recentTasks?.slice(0, 5) || []} />
              </table>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <ActivityFeed limit={10} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
