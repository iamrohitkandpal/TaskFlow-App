import React, { useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FaCheck } from "react-icons/fa";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { getInitials } from "../../utils";

const UserList = ({ users, team = [], setTeam }) => {
  useEffect(() => {
    // Initialize team with existing members if any
    if (team.length === 0 && users?.length > 0) {
      // Optional: Can pre-select some users here
    }
  }, [users, team]);

  const handleChange = (selectedUsers) => {
    setTeam(selectedUsers);
  };

  return (
    <Listbox value={team} onChange={handleChange} multiple>
      <div className="relative">
        <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
          <span className="block truncate">
            {team.length > 0
              ? `${team.length} team member${team.length > 1 ? 's' : ''} selected`
              : "Select Team Members"}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <MdOutlineKeyboardArrowDown
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {users.length > 0 ? (
              users.map((user) => {
                const isSelected = team.includes(user._id);
                return (
                  <Listbox.Option
                    key={user._id}
                    value={user._id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-indigo-100 text-indigo-900" : "text-gray-900"
                      }`
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm mr-2">
                            {getInitials(user.name)}
                          </div>
                          <span className="block truncate font-normal">
                            {user.name}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                            <FaCheck className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                );
              })
            ) : (
              <div className="py-2 px-4 text-sm text-gray-500">
                No users available
              </div>
            )}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

export default UserList;
