import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useEffect, useState } from "react";
import { getInitials } from "../../utils";
import { BsChevronExpand } from "react-icons/bs";
import { MdCheck } from "react-icons/md";
import { useGetTeamListQuery } from "../../redux/slices/api/userApiSlice";

const UserList = ({ setTeam, team }) => {
  const {data, isLoading} = useGetTeamListQuery();
  const [selectedUsers, setSelectedUsers] = useState([]);
  // console.log(data, team);

  const handleChange = (selected) => {
    setSelectedUsers(selected);
    setTeam(selected)?.map((user) => user?._id);
  };

  useEffect(() => {
    if(team?.length < 1) {
        data && setSelectedUsers([data?.users[0]]);
    } else {
        setSelectedUsers(team);
    }
  }, [isLoading]);

  return (
    <div>
      <p className="text-gray-700 mb-1">Assign Task To:</p>
      <Listbox value={selectedUsers} onChange={handleChange} multiple>
        <div className="relative">
          <ListboxButton
            className="relative w-full cursor-default rounded bg-white border border-gray-300 px-3 py-2.5 sm:text-sm text-left focus:outline-none focus:ring-2 focus:ring-violet-500"
            name="Choose User"
          >
            <span className="block truncate text-base text-gray-900">
              {selectedUsers?.length > 0
                ? selectedUsers.map((user) => user?.name).join(", ")
                : <p className="text-gray-400">Select Users</p>}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <BsChevronExpand
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              {data?.users?.map((user, index) => (
                <ListboxOption
                  key={index}
                  value={user}
                  className={({ active }) =>
                    clsx(
                      "relative cursor-default select-none py-2 pl-10 pr-4",
                      active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <div
                        className={clsx(
                          "flex items-center gap-2 truncate",
                          selected ? "font-medium" : "font-normal"
                        )}
                      >
                        <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center">
                          <span className="text-center text-[10px]">
                            {getInitials(user?.name)}
                          </span>
                        </div>
                        <span>{user?.name}</span>
                      </div>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          <MdCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default UserList;
