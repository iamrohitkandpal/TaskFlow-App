import React, { useState, useEffect } from "react";
import ModalWrapper from "../task/ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "../Textbox";
import UserList from "./UserList";
import SelectList from "../task/SelectList";
import { BiImages } from "react-icons/bi";
import Button from "../Button";
import { toast } from "sonner";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../redux/slices/api/taskApiSlice";
import { useForm } from "react-hook-form";
import { cloudinaryURL } from "../../utils/cloudinary";
import { dateFormatter } from "../../utils";
import { useGetTeamListQuery } from "../../redux/slices/api/userApiSlice";
import { useEstimateEffortForNewTaskMutation } from '../../redux/slices/api/aiApiSlice';
import RichTextEditor from '../editors/RichTextEditor';
import { useDispatch } from 'react-redux';
import { apiSlice } from "../../redux/slices/apiSlice";
import axios from "axios";

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];

const AddTask = ({ open, setOpen, task }) => {
  console.log("Task:", task); 

  const defaultValues = {
    title: task?.title || "",
    date: dateFormatter(task?.date || new Date()),
    team: [],
    stage: "",
    priority: "",
    assets: [],
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({ defaultValues });

  const [team, setTeam] = useState(task?.team || []);
  const [stage, setStage] = useState(task?.stage?.toUpperCase() || LISTS[0]);
  const [priority, setPriority] = useState(
    task?.priority?.toUpperCase() || PRIORITY[2]
  );
  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [estimatedEffort, setEstimatedEffort] = useState(null);
  const [estimateEffort] = useEstimateEffortForNewTaskMutation();
  const [description, setDescription] = useState(task?.description || '');
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState(null);

  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const { data: teamData, isLoading: isLoadingTeam } = useGetTeamListQuery();
  const dispatch = useDispatch();

  const submitHandler = async (data) => {
    // Cache the previous state for rollback
    const previousTaskData = task ? { ...task } : null;
    
    // Show optimistic UI update
    if (task?._id) {
      // For updates, optimistically update the UI
      dispatch(updateTaskInCache({ 
        ...data, 
        _id: task._id,
        updatedAt: new Date().toISOString()
      }));
    }

    try {
      // Process file uploads with progress tracking
      const uploadedFileURLs = [];
      setUploading(true);
      
      if (assets.length > 0) {
        for (const file of assets) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "taskflow");
          
          const response = await axios.post(
            "https://api.cloudinary.com/v1_1/your-cloud/image/upload",
            formData,
            {
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress(percentCompleted);
              },
              // Add retry logic for interrupted uploads
              timeout: 30000
            }
          );
          uploadedFileURLs.push(response.data.secure_url);
        }
      }
      
      // Combine form data with uploaded files
      const taskData = {
        ...data,
        assets: uploadedFileURLs,
      };
      
      // Make API request with version tracking
      if (task?._id) {
        // For updates, include version/timestamp for conflict detection
        const result = await updateTask({
          ...taskData,
          id: task._id,
          lastModified: task.updatedAt // Send last known update timestamp 
        }).unwrap();
        
        toast.success(result?.message || "Task updated successfully");
      } else {
        // For new tasks
        const result = await createTask(taskData).unwrap();
        toast.success(result?.message || "Task created successfully");
      }
      
      // Reset form and close modal
      dispatch(setTask(null));
      setOpen(false);
      
    } catch (error) {
      console.error("Error in task submission:", error);
      
      // Check for version conflict
      if (error?.data?.conflict) {
        // Handle conflict with merge options
        toast.error("This task was updated by someone else. Please review the changes.");
        // Offer conflict resolution options
        setShowConflictDialog(true);
        setConflictData({
          serverVersion: error.data.serverData,
          localVersion: data
        });
      } else {
        // Regular error handling
        toast.error(error?.data?.message || "Something went wrong");
        
        // Rollback optimistic update if needed
        if (previousTaskData) {
          dispatch(revertTaskUpdate({
            _id: task._id,
            data: previousTaskData
          }));
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total size first
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total
    
    if (totalSize > MAX_TOTAL_SIZE) {
      toast.error(`Total file size exceeds the 25MB limit. Please reduce file size or upload fewer files.`);
      e.target.value = ""; // Clear the file input
      return;
    }
    
    // Then check individual files
    const invalidFiles = files.filter(file => 
      !ALLOWED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE
    );
    
    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(f => f.name).join(", ");
      toast.error(`Invalid files: ${invalidNames}. Please only upload images, PDFs or text files under 5MB.`);
      
      // Filter out invalid files
      const validFiles = files.filter(file => 
        ALLOWED_FILE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
      );
      setAssets(validFiles);
      
      // If all files were invalid, clear the input
      if (validFiles.length === 0) {
        e.target.value = "";
      }
    } else {
      setAssets(files);
    }
  };

  const handleEstimateEffort = async () => {
    try {
      // Only attempt to estimate if we have a title and priority
      if (!watch('title')) {
        return;
      }
      
      // Get current form data
      const currentFormData = {
        title: watch('title'),
        description: watch('description'),
        priority: priority.toLowerCase(),
        team: team
      };
      
      const result = await estimateEffort(currentFormData).unwrap();
      
      if (result.status && result.effortDays) {
        setEstimatedEffort(result.effortDays);
      }
    } catch (error) {
      console.error('Error estimating effort:', error);
    }
  };

  useEffect(() => {
    const title = watch('title');
    if (title && title.length > 5) {
      // Debounce the estimation to avoid too many API calls
      const timer = setTimeout(() => {
        handleEstimateEffort();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [watch('title'), priority]);

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <Dialog.Title
          as="h2"
          className="text-base font-bold leading-6 text-gray-900 mb-4"
        >
          {task ? "UPDATE TASK" : "ADD TASK"}
        </Dialog.Title>

        <div className="mt-2 flex flex-col gap-6">
          <Textbox
            placeholder="Task Title"
            type="text"
            name="title"
            label="Task Name"
            className="w-full rounded"
            register={register("title", { required: "Title is required" })}
            error={errors.title ? errors.title.message : ""}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Team Members
            </label>
            {isLoadingTeam ? (
              <div className="text-sm">Loading team members...</div>
            ) : teamData?.users?.length > 0 ? (
              <UserList users={teamData.users || []} setTeam={setTeam} team={team} />
            ) : (
              <div className="text-sm text-red-500">
                No active users available for assignment
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <SelectList
              label="Task Stage"
              lists={LISTS}
              selected={stage}
              setSelected={setStage}
            />

            <div className="w-full">
              <Textbox
                placeholder="Date"
                type="date"
                name="date"
                label="Task Date"
                className="w-full rounded"
                register={register("date", { required: "Date is required!" })}
                error={errors.date ? errors.date.message : ""}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <SelectList
              label="Priority Level"
              lists={PRIORITY}
              selected={priority}
              setSelected={setPriority}
            />
            
            <div className="w-full">
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effort Estimate
                </label>
                {estimatedEffort ? (
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-2 rounded-md text-sm font-medium ${
                      estimatedEffort <= 2 
                        ? 'bg-green-100 text-green-800' 
                        : estimatedEffort <= 5 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {estimatedEffort <= 2 
                        ? 'Quick Task' 
                        : estimatedEffort <= 5 
                          ? 'Medium Effort' 
                          : 'Substantial Effort'} 
                      ({estimatedEffort} day{estimatedEffort !== 1 ? 's' : ''})
                    </div>
                    <button 
                      type="button" 
                      onClick={handleEstimateEffort}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Re-estimate
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleEstimateEffort}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Generate Effort Estimate
                  </button>
                )}
              </div>
            </div>

            <div className="w-full flex items-center justify-center mt-4">
              <label
                className="flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4"
                htmlFor="imgUpload"
              >
                <input
                  type="file"
                  className="hidden"
                  id="imgUpload"
                  onChange={(e) => handleSelect(e)}
                  accept=".jpg, .png, .jpeg"
                  multiple={true}
                />
                <BiImages />
                <span>Add Assets</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Enter task description..."
            />
          </div>

          <div className="bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4">
            {uploading ? (
              <span className="text-sm py-2 text-red-500">
                Uploading assets... {uploadProgress}%
              </span>
            ) : (
              <Button
                label="Submit"
                type="submit"
                className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
              />
            )}

            <Button
              type="button"
              className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
              onClick={() => setOpen(false)}
              label="Cancel"
            />
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default AddTask;
