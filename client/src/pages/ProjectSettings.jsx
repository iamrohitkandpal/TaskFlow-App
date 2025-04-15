import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Divider, TextField, Button as MuiButton } from '@mui/material';
import NotificationSettings from '../components/settings/NotificationSettings';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Title from '../components/Title';
import Button from '../components/Button';
import ConfirmationDialog from '../components/Dialogs';
import { toast } from 'react-toastify';

const API_BASE_URL = '/api';

const ProjectSettings = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteMsg, setDeleteMsg] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteConfirmOptions, setDeleteConfirmOptions] = useState({ show: false, message: '', taskCount: 0 });
    
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await axios.get(`/api/projects/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data.status) {
                    setProject(response.data.project);
                    setName(response.data.project.name);
                    setDescription(response.data.project.description || '');
                }
            } catch (err) {
                console.error('Failed to load project:', err);
                setError('Failed to load project details. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        
        if (projectId && token) {
            fetchProject();
        }
    }, [projectId, token]);
    
    const handleSaveProject = async () => {
        try {
            setLoading(true);
            const response = await axios.put(
                `/api/projects/${projectId}`,
                { name, description },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            if (response.data.status) {
                setProject(response.data.project);
            }
        } catch (err) {
            console.error('Failed to update project:', err);
            setError('Failed to update project. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteProject = async () => {
        setDeleteLoading(true);
        
        try {
            // First check project status
            const statusCheck = await axios.get(
                `${API_BASE_URL}/projects/${projectId}/delete-check`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // If project has active tasks, show confirmation
            if (statusCheck.data.hasActiveTasks) {
                setDeleteConfirmOptions({
                    show: true,
                    message: `This project has ${statusCheck.data.taskCount} active tasks. 
                              Are you sure you want to delete it?`,
                    taskCount: statusCheck.data.taskCount
                });
                return;
            }
            
            // Proceed with deletion
            await performProjectDeletion();
            
        } catch (err) {
            console.error('Failed to check project status:', err);
            
            if (!navigator.onLine) {
                setError('You are offline. Please try again when connected.');
            } else if (err.response?.status === 403) {
                setError('You do not have permission to delete this project.');
            } else {
                setError('Failed to delete project. Please try again.');
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    const performProjectDeletion = async () => {
        try {
            const response = await axios.delete(
                `${API_BASE_URL}/projects/${projectId}`, 
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000 // 10 second timeout for deletion
                }
            );
            
            if (response.data.status) {
                toast.success('Project deleted successfully');
                // Redirect after a short delay to allow toast to be seen
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            }
        } catch (err) {
            console.error('Failed to delete project:', err);
            setError('Failed to delete project: ' + (err.response?.data?.message || 'Unknown error'));
        }
    };

    if (loading) return <div>Loading project settings...</div>;
    if (error) return <div className="text-red-600">{error}</div>;
    
    return (
        <div className="w-full md:px-4 px-1 mb-6">
            <div className="flex items-center justify-between mb-6">
                <Title title="Project Settings" />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Project Information Section */}
                <Paper className="p-4 shadow-md rounded">
                    <div className="flex justify-between items-center mb-4">
                        <Typography variant="h6" component="h2" className="text-lg font-bold">
                            Project Information
                        </Typography>
                    </div>
                    <Divider className="mb-4" />
                    
                    <Box component="form" className="space-y-4">
                        <div>
                            <Typography variant="subtitle1">Project Name</Typography>
                            <TextField
                                fullWidth
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                variant="outlined"
                                size="small"
                            />
                        </div>
                        
                        <div>
                            <Typography variant="subtitle1">Description</Typography>
                            <TextField
                                fullWidth
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                variant="outlined"
                                multiline
                                rows={4}
                                size="small"
                            />
                        </div>
                        
                        <div className="flex justify-end">
                            <Button
                                label="Save Changes"
                                className="bg-blue-600 text-white rounded-md"
                                onClick={handleSaveProject}
                                disabled={loading}
                            />
                        </div>
                    </Box>
                </Paper>

                {/* Project Notifications Section */}
                <Paper className="p-4 shadow-md rounded">
                    <Typography variant="h6" component="h2" className="text-lg font-bold mb-4">
                        Project Notifications
                    </Typography>
                    <Divider className="mb-4" />
                    <NotificationSettings projectId={projectId} />
                </Paper>

                {/* Danger Zone */}
                <Paper className="p-4 shadow-md rounded border border-red-200">
                    <Typography variant="h6" component="h2" className="text-lg font-bold text-red-600 mb-4">
                        Danger Zone
                    </Typography>
                    <Divider className="mb-4" />
                    
                    <div className="flex justify-between items-center">
                        <div>
                            <Typography variant="subtitle1" className="font-bold">Delete this project</Typography>
                            <Typography variant="body2" className="text-gray-600">
                                Once you delete a project, there is no going back. Please be certain.
                            </Typography>
                        </div>
                        <Button
                            label="Delete Project"
                            className="bg-red-600 text-white rounded-md"
                            onClick={() => {
                                setDeleteMsg(`Are you sure you want to delete "${project?.name}"?`);
                                setOpenDeleteDialog(true);
                            }}
                        />
                    </div>
                </Paper>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={openDeleteDialog}
                setOpen={setOpenDeleteDialog}
                msg={deleteMsg}
                setMsg={setDeleteMsg}
                onClick={handleDeleteProject}
                type="delete"
            />
        </div>
    );
};

export default ProjectSettings;