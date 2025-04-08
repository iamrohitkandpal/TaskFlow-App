import { useForm } from "react-hook-form";
import ModalWrapper from "../task/ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "../Textbox";
import Button from "../Button";
import { useCreateSubTaskMutation } from "../../redux/slices/api/taskApiSlice";
import { toast } from "sonner";
import { useDispatch } from 'react-redux';
import { apiSlice } from '../../redux/slices/apiSlice';

const AddSubTask = ({ open, setOpen, id }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Uncomment and implement the mutation as required
  const [addSubTask] = useCreateSubTaskMutation();
  const dispatch = useDispatch();

  const handleOnSubmit = async (data) => {
    try {
      const res = await addSubTask({ data, id }).unwrap();
      toast.success(res.message);
      setTimeout(() => {
        setOpen(false);
        dispatch(apiSlice.util.invalidateTags(['Tasks'])); // Refresh task data without full page reload
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "An error occurred!");
    }
  };

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(handleOnSubmit)} className='space-y-4'>
        <Dialog.Title
          as='h2'
          className='text-base font-bold leading-6 text-gray-900 mb-4'
        >
          ADD SUB-TASK
        </Dialog.Title>

        <div className='flex flex-col gap-6'>
          <Textbox
            placeholder='Sub-Task Title'
            type='text'
            name='title'
            label='Title'
            className='w-full rounded'
            register={register("title", {
              required: "Title is required!",
            })}
            error={errors.title ? errors.title.message : ""}
          />

          <div className='flex items-center gap-4'>
            <Textbox
              placeholder='Date'
              type='date'
              name='date'
              label='Task Date'
              className='w-full rounded'
              register={register("date", {
                required: "Date is required!",
              })}
              error={errors.date ? errors.date.message : ""}
            />
            <Textbox
              placeholder='Tag'
              type='text'
              name='tag'
              label='Tag'
              className='w-full rounded'
              register={register("tag", {
                required: "Tag is required!",
              })}
              error={errors.tag ? errors.tag.message : ""}
            />
          </div>
        </div>

        <div className='py-3 mt-4 flex flex-col sm:flex-row-reverse gap-4'>
          <Button
            type='submit'
            aria-label='Add Task'
            className='bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto'
            label='Add Task'
          />
          <Button
            type='button'
            aria-label='Cancel'
            className='bg-white border text-sm font-semibold text-gray-900 sm:w-auto'
            onClick={() => setOpen(false)}
            label='Cancel'
          />
        </div>
      </form>
    </ModalWrapper>
  );
};

export default AddSubTask;
