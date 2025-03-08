import React from "react";
import ModalWrapper from "./task/ModalWrapper";
import { Dialog } from "@headlessui/react";
import Button from "./Button";

const ViewNotification = ({ open, setOpen, item }) => {
  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <div className="py-4 w-full flex flex-col gap-4 items-center justify-center">
          <Dialog.Title as="h3" className="font-semibold text-lg">
            {item?.task?.title}
          </Dialog.Title>

          <p className="text-start text-gray-500">{item?.text}</p>

          <Button
            type="button"
            className="bg-white px-8 text-sm font-semibold text-gray-900 sm:w-auto"
            onClick={() => setOpen(false)}
            label="Ok"
          />
        </div>
      </ModalWrapper>
    </>
  );
};

export default ViewNotification;
