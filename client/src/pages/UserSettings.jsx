import React from 'react';
import { Typography, Paper, Box, Divider } from '@mui/material';
import NotificationSettings from '../components/settings/NotificationSettings';
import { useSelector } from 'react-redux';
import Title from '../components/Title';
import ChangePassword from '../components/ChangePassword';
import { useState } from 'react';
import Button from '../components/Button';
import { FaUserLock } from 'react-icons/fa';
import AddUser from '../components/AddUser';

const UserSettings = () => {
    const { user } = useSelector((state) => state.auth);
    const [openPassword, setOpenPassword] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);

    return (
        <div className="w-full md:px-4 px-1 mb-6">
            <div className="flex items-center justify-between mb-6">
                <Title title="User Settings" />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Profile Section */}
                <Paper className="p-4 shadow-md rounded">
                    <div className="flex justify-between items-center mb-4">
                        <Typography variant="h6" component="h2" className="text-lg font-bold">
                            Profile Information
                        </Typography>
                        <Button
                            label="Edit Profile"
                            className="bg-blue-600 text-white rounded-md"
                            onClick={() => setOpenProfile(true)}
                        />
                    </div>
                    <Divider className="mb-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="text-base font-medium">{user?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-base font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="text-base font-medium">{user?.role}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Title</p>
                            <p className="text-base font-medium">{user?.title}</p>
                        </div>
                    </div>
                    
                    <Divider className="my-4" />
                    
                    <Button
                        label="Change Password"
                        icon={<FaUserLock className="mr-2" />}
                        className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                        onClick={() => setOpenPassword(true)}
                    />
                </Paper>

                {/* Notification Settings */}
                <Paper className="p-4 shadow-md rounded">
                    <Typography variant="h6" component="h2" className="text-lg font-bold mb-4">
                        Notification Settings
                    </Typography>
                    <Divider className="mb-4" />
                    <NotificationSettings />
                </Paper>
            </div>

            {/* Modals */}
            <ChangePassword open={openPassword} setOpen={setOpenPassword} />
            <AddUser 
                open={openProfile} 
                setOpen={setOpenProfile} 
                userData={user}
                key={user?._id} 
            />
        </div>
    );
};

export default UserSettings;