import React from "react";
import ModalWrapper from "./task/ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "./Textbox";
import Loader from "./Loader";
import Button from "./Button";
import { useForm } from "react-hook-form";
import { useChangePasswordMutation } from "../redux/slices/api/userApiSlice";
import { toast } from "sonner";

const ChangePassword = ({ open, setOpen }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [changeUserPassword, { isLoading }] = useChangePasswordMutation();

  const handleOnSubmit = async (data) => {
    if(data?.password !== data.cpass) {
      toast.warning("Password Doesn't Match");
      return;
    }
    
    try {
      await changePassword(data).unwrap();
      toast.success("Password Changed Successfully!");
      reset();
    } catch (error) {
      console.log("ERROR IN CHANGE PASSWORD: ", error);
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleSubmit(handleOnSubmit)}>
          <Dialog.Title
            as="h3"
            className="text-base font-bold leading-6 text-green-900 mb-4"
          >
            Change Password
          </Dialog.Title>
          <div className="mt-2 flex flex-col gap-6">
            <Textbox
              placeholder="New Password"
              type="password"
              name="password"
              label="New Password"
              className="w-full rounded"
              register={register("password", {
                required: "New password is required!",
              })}
              error={errors.password ? errors.password.message : ""}
            />
            <Textbox
              placeholder="Confirm New Password"
              type="password"
              name="cpass"
              label="Confirm New Password"
              className="w-full rounded"
              register={register("cpass", {
                required: "Confirm New password is required!",
              })}
              error={errors.cpass ? errors.cpass.message : ""}
            />
          </div>

          {isLoading ? (
            <div className="py-5">
              <Loader />
            </div>
          ) : (
            <div className="py-3 mt-4 gap-2 sm:flex sm:flex-row-reverse">
              <Button
                type="submit"
                className="bg-blue-600 px-8 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
                label="Save"
              />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-white px-8 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-100 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </ModalWrapper>
    </>
  );
};

export default ChangePassword;
