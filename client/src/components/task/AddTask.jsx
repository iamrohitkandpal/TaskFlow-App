// import React, { useState } from "react";
// import ModalWrapper from "../task/ModalWrapper";
// import { Dialog } from "@headlessui/react";
// import Textbox from "../Textbox";
// import UserList from "./UserList";
// import SelectList from "../task/SelectList";
// import { BiImages } from "react-icons/bi";
// import Button from "../Button";
// import axios from "axios";
// import { toast } from "sonner";
// import {
//   useCreateTaskMutation,
//   useUpdateTaskMutation,
// } from "../../redux/slices/api/taskApiSlice";
// import { useForm } from "react-hook-form";
// import { cloudinaryURL } from "../../utils/cloudinary";

// const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
// const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

// const uploadedFileURLs = [];

// const AddTask = ({ open, setOpen }) => {
//   const task = "";

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm();
//   const [team, setTeam] = useState(task?.team || []);
//   const [stage, setStage] = useState(task?.stage?.toUpperCase() || LISTS[0]);
//   const [priority, setPriority] = useState(
//     task?.priority?.toUpperCase() || PRIORITY[2]
//   );
//   const [assets, setAssets] = useState([]);
//   const [uploading, setUploading] = useState(false);

//   const [createTask, { isLoading }] = useCreateTaskMutation();
//   const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
//   const URLS = task?.assets ? [...task.assets] : [];

//   const submitHandler = async (data) => {
//     for (const file of assets) {
//       setUploading(true);
//       try {
//         await uploadFile(file);
//       } catch (error) {
//         console.error("Error uploading file:", error.message);
//         return;
//       } finally {
//         setUploading(false);
//       }
//     }

//     try {
//       const newData = {
//         ...data,
//         assets: [...URLS, ...uploadedFileURLs],
//         team,
//         stage,
//         priority,
//       };
//       const res = task?._id
//         ? await updateTask({ ...newData, _id: task._id }).unwrap()
//         : await createTask(newData).unwrap();

//       toast.success(res.message);

//       setTimeout(() => setOpen(false), 1000);
//     } catch (error) {}
//   };

//   const handleSelect = (e) => {
//     const selectedFiles = e.target.files;
//     setAssets(selectedFiles);
//     console.log("Selected files:", selectedFiles);
//   };

//   const uploadFile = async (file) => {
//     // const formData = new FormData();
//     // formData.append("file", file);
//     // formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

//     try {
//       const response = await cloudinaryURL(file);
//       console.log(response);
//       uploadedFileURLs.push(response);
//     } catch (error) {
//       console.error("Cloudinary upload error:", error);
//       toast.error("Error uploading file");
//       throw error;
//     }
//   };

//   return (
//     <>
//       <ModalWrapper open={open} setOpen={setOpen}>
//         <form onSubmit={handleSubmit(submitHandler)}>
//           <Dialog.Title
//             as="h2"
//             className="text-base font-bold leading-6 text-gray-900 mb-4"
//           >
//             {task ? "UPDATE TASK" : "ADD TASK"}
//           </Dialog.Title>

//           <div className="mt-2 flex flex-col gap-6">
//             <Textbox
//               placeholder="Task Title"
//               type="text"
//               name="title"
//               label="Task Name"
//               className="w-full rounded"
//               register={register("title", { required: "Title is required" })}
//               error={errors.title ? errors.title.message : ""}
//             />

//             <UserList setTeam={setTeam} team={team} />

//             <div className="flex gap-4">
//               <SelectList
//                 label="Task Stage"
//                 lists={LISTS}
//                 selected={stage}
//                 setSelected={setStage}
//               />

//               <div className="w-full">
//                 <Textbox
//                   placeholder="Date"
//                   type="date"
//                   name="date"
//                   label="Task Date"
//                   className="w-full rounded"
//                   register={register("date", {
//                     required: "Date is required!",
//                   })}
//                   error={errors.date ? errors.date.message : ""}
//                 />
//               </div>
//             </div>

//             <div className="flex gap-4">
//               <SelectList
//                 label="Priority Level"
//                 lists={PRIORITY}
//                 selected={priority}
//                 setSelected={setPriority}
//               />

//               <div className="w-full flex items-center justify-center mt-4">
//                 <label
//                   className="flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4"
//                   htmlFor="imgUpload"
//                 >
//                   <input
//                     type="file"
//                     className="hidden"
//                     id="imgUpload"
//                     onChange={(e) => handleSelect(e)}
//                     accept=".jpg, .png, .jpeg"
//                     multiple={true}
//                   />
//                   <BiImages />
//                   <span>Add Assets</span>
//                 </label>
//               </div>
//             </div>

//             <div className="bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4">
//               {uploading ? (
//                 <span className="text-sm py-2 text-red-500">
//                   Uploading assets
//                 </span>
//               ) : (
//                 <Button
//                   label="Submit"
//                   type="submit"
//                   className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700  sm:w-auto"
//                 />
//               )}

//               <Button
//                 type="button"
//                 className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
//                 onClick={() => setOpen(false)}
//                 label="Cancel"
//               />
//             </div>
//           </div>
//         </form>
//       </ModalWrapper>
//     </>
//   );
// };

// export default AddTask;

import React, { useState } from "react";
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

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

const AddTask = ({ open, setOpen, task }) => {
  // console.log("Task:", task);

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
  } = useForm({ defaultValues });

  const [team, setTeam] = useState(task?.team || []);
  const [stage, setStage] = useState(task?.stage?.toUpperCase() || LISTS[0]);
  const [priority, setPriority] = useState(
    task?.priority?.toUpperCase() || PRIORITY[2]
  );
  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const submitHandler = async (data) => {
    const uploadedFileURLs = [];
    setUploading(true);

    try {
      // Upload each file to Cloudinary
      for (const file of assets) {
        const url = await cloudinaryURL(file);
        uploadedFileURLs.push(url);
      }

      const newData = {
        ...data,
        assets: uploadedFileURLs,
        team,
        stage,
        priority,
      };

      // console.log("New data:", newData);

      const res = task?._id
        ? await updateTask({ ...newData, _id: task._id }).unwrap()
        : await createTask(newData).unwrap();

      toast.success(res.message);

      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error submitting the form:", error.message);
      toast.error("Failed to submit the task.");
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setAssets(selectedFiles);
    console.log("Selected files:", selectedFiles);
  };

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

          <UserList setTeam={setTeam} team={team} />

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

          <div className="bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4">
            {uploading ? (
              <span className="text-sm py-2 text-red-500">
                Uploading assets...
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
