import React, { useState } from "react";
import { IoMdAdd } from "react-icons/io";
import Title from "../components/Title";
import { summary } from "../assets/data";
import { getInitials } from "../utils";
import clsx from "clsx";
import ConfirmationDialog, { UserAction } from "./../components/Dialogs";
import AddUser from "./../components/AddUser";
import Button from "../components/Button";
import {
  useDeleteUserMutation,
  useGetTeamListQuery,
  useUserActionsMutation,
} from "../redux/slices/api/userApiSlice";
import { toast } from "sonner";
import Loader from "../components/Loader";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");

const Users = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [openAction, setOpenAction] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const { data, isLoading, refetch } = useGetTeamListQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [userActions] = useUserActionsMutation();

  const userActionHandler = async () => {
    try {
      const result = await userActions({
        isActive: !selected?.isActive,
        id: selected?._id,
      });

      refetch();
      toast.success(result?.data?.message || "User Status Updated");

      setSelected(null);
      setTimeout(() => {
        setOpenAction(false);
      }, 500);
    } catch (error) {
      console.log("Error in userActionHandler: ", error);
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  const deleteHandler = async () => {
    setIsDeleting(true);
    
    try {
      // First check if user has assigned tasks
      const checkResponse = await axios.get(
        `${API_BASE_URL}/users/${selected._id}/can-delete`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (checkResponse.data.hasAssignedTasks) {
        setDeleteConfirmation({
          show: true,
          message: `This user has ${checkResponse.data.taskCount} assigned tasks. 
                   How would you like to handle these tasks?`,
          options: [
            {value: 'reassign', label: 'Reassign to another user'},
            {value: 'unassign', label: 'Remove assignments'},
            {value: 'delete', label: 'Delete tasks'}
          ]
        });
        
        return;
      }
      
      // If no tasks or user confirmed deletion approach
      const result = await deleteUser({
        id: selected._id,
        taskHandling: deleteConfirmation?.selectedOption || 'none'
      }).unwrap();

      refetch();
      toast.success(result?.message || "User deleted successfully");
      
      // Clean up
      setSelected(null);
      setDeleteConfirmation(null);
      setOpenDialog(false);
      
    } catch (error) {
      console.error("Error in deleteHandler: ", error);
      
      // More specific error messages based on error types
      if (error?.data?.code === 'TASKS_EXIST') {
        toast.error("User has assigned tasks. Please choose how to handle them.");
      } else if (error?.status === 403) {
        toast.error("You don't have permission to delete this user");
      } else {
        toast.error(error?.data?.message || "Failed to delete user");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if(isLoading) {
    return (
      <div className="py-10">
        <Loader />
      </div>
    )
  }

  const deleteClick = (id) => {
    setSelected(id);
    setOpenDialog(true);
  };

  const editClick = (user) => {
    setSelected(user);
    setOpen(true);
  };

  const userStatusClick = (user) => {
    setSelected(user);
    setOpenAction(true);
  };

  const TableHeader = () => (
    <thead className="border-b border-gray-300">
      <tr className="text-black text-left">
        <th className="py-2">Full Name</th>
        <th className="py-2">Title</th>
        <th className="py-2">Email</th>
        <th className="py-2">Role</th>
        <th className="py-2">Active</th>
      </tr>
    </thead>
  );

  const TableRow = ({ user }) => (
    <tr className="border-b border-gray-200 text-gray-600 hover:bg-gray-400/10">
      <td className="p-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm bg-blue-700">
            <span className="text-xs md:text-sm text-center">
              {getInitials(user?.name)}
            </span>
          </div>
          {user?.name}
        </div>
      </td>

      <td className="p-2">{user?.title}</td>
      <td className="p-2">{user?.email || "user.email.com"}</td>
      <td className="p-2">{user?.role}</td>

      <td>
        <button
          onClick={() => userStatusClick(user)}
          className={clsx(
            "w-fit px-4 py-1 rounded-full",
            user?.isActive ? "bg-blue-200" : "bg-yellow-100"
          )}
        >
          {user?.isActive ? "Active" : "Disabled"}
        </button>
      </td>

      <td className="p-2 flex gap-4 justify-end">
        <Button
          className="text-blue-600 hover:text-blue-500 font-semibold sm:px-0"
          label="Edit"
          type="button"
          onClick={() => editClick(user)}
        />

        <Button
          className="text-red-700 hover:text-red-500 font-semibold sm:px-0"
          label="Delete"
          type="button"
          onClick={() => deleteClick(user?._id)}
        />
      </td>
    </tr>
  );


  return (
    <>
      <div className="w-full md:px-1 px-0 mb-6">
        <div className="flex items-center justify-between mb-8">
          <Title title="  Team Members" />
          <Button
            label="Add New User"
            icon={<IoMdAdd className="text-lg" />}
            className="flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md 2xl:py-2.5"
            onClick={() => setOpen(true)}
          />
        </div>

        <div className="bg-white px-2 md:px-4 py-4 shadow-md rounded">
          <div className="overflow-x-auto">
            <table className="w-full mb-5">
              <TableHeader />
              <tbody>
                {data?.users?.map((user, index) => (
                  <TableRow key={index} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddUser
        open={open}
        setOpen={setOpen}
        userData={selected}
        key={new Date().getTime().toString()}
      />

      <ConfirmationDialog
        open={openDialog}
        setOpen={setOpenDialog}
        onClick={deleteHandler}
      />

      <UserAction
        open={openAction}
        setOpen={setOpenAction}
        onClick={userActionHandler}
      />
    </>
  );
};

export default Users;
