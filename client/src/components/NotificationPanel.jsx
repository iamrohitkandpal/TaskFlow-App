import { Popover, Transition } from "@headlessui/react";
import moment from "moment";
import { Fragment, useState } from "react";
import { BiSolidMessageRounded } from "react-icons/bi";
import { HiBellAlert } from "react-icons/hi2";
import { IoIosNotificationsOutline } from "react-icons/io";
import { Link } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
} from "../redux/slices/api/userApiSlice";
import ViewNotification from './ViewNotification';

const ICONS = {
  alert: (
    <HiBellAlert className="h-5 w-8 rounded-full text-gray-600 group-hover:text-indigo-600" />
  ),
  message: (
    <BiSolidMessageRounded className="h-5 w-8 text-gray-600 group-hover:text-indigo-600" />
  ),
};

const NotificationPanel = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data, error, isLoading, refetch } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
    skip: !navigator.onLine // Skip polling when offline
  });
  const [markAsRead] = useMarkNotificationAsReadMutation();

  const readHandler = async (type, id) => {
    if (!id && type !== "all") {
      console.error("Invalid notification ID or type.");
      return;
    }
    try {
      await markAsRead({ type, id }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };
  

  const viewHandler = async (item) => {
    if (!item?._id) {
      console.error("Notification ID is undefined.");
      return;
    }
    setSelected(item);
    console.log(item);
    readHandler("one", item._id);
    setOpen(true);
  };
  

  const callsToAction = [
    { name: "Cancel", href: "#", icon: "" },
    {
      name: "Mark All Read",
      href: "#",
      icon: "",
      onClick: () => readHandler("all", ""),
    },
  ];

  // Show offline state to users
  if (error?.status === 'FETCH_ERROR') {
    return (
      <div className="p-4 text-gray-500">
        <p>Currently offline. Data will sync when connection is restored.</p>
      </div>
    );
  }

  return (
    <>
      <Popover className="relative">
        <Popover.Button className="inline-flex items-center outline-none">
          <div className="w-8 h-8 flex items-center justify-center text-gray-800 relative">
            <IoIosNotificationsOutline className="text-2xl" />
            {data?.notices?.length > 0 && (
              <span className="absolute flex justify-center items-center -top-0.5 -right-0 text-xs text-white font-semibold w-4 h-4 rounded-full bg-red-600">
                {data?.notices?.length}
              </span>
            )}
          </div>
        </Popover.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel className="absolute -right-16 md:-right-2 mt-5 flex w-screen max-w-max px-4">
            {({ close }) =>
              data?.notices?.length > 0 && (
                <div className="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
                  <div className="p-4 z-20">
                    {data.notices?.slice(0, 5).map((item, index) => (
                      <div
                        key={item._id + index}
                        className="group relative flex gap-x-4 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="mt-1 h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 group-hover:bg-white">
                          {ICONS[item.notiType]}
                        </div>

                        <div
                          className="cursor-pointer"
                          onClick={() => viewHandler(item)}
                        >
                          <div className="flex items-center gap-3 font-semibold text-gray-900 capitalize">
                            <p> {item.notiType}</p>
                            <span className="text-xs font-normal lowercase">
                              {moment(item.createdAt).fromNow()}
                            </span>
                          </div>
                          <p className="line-clamp-1 mt-1 text-gray-600">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 divide-x bg-gray-50">
                    {callsToAction.map((item) => (
                      <Link
                        key={item.name}
                        onClick={
                          item?.onClick ? () => item.onClick() : () => close()
                        }
                        className="flex items-center justify-center gap-x-2.5 p-3 font-semibold text-blue-600 hover:bg-gray-100"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }
          </Popover.Panel>
        </Transition>
      </Popover>

      <ViewNotification open={open} setOpen={setOpen} item={selected} />
    </>
  );
};

export default NotificationPanel;
