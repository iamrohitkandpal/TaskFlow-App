import React from "react";
import clsx from "clsx";

const Textbox = React.forwardRef(
  ({ type, name, placeholder, className, register, label, error }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {label && <label htmlFor={name} className="text-slate-800">{label}</label>}
        <div>
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            ref={ref}
            className={clsx("bg-transparent px-3 py-2.5 2xl:py-3 border border-gray-300 placeholder-gray-400 text-gray-900 outline-none text-base focus:ring-1 ring-sky-400", className)}
            {...register}
            aria-invalid={error ? "true" : "false"}
          />
        </div>

        {error && (
          <span className="text-xs text-[#f64949fe] mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  }
);

// Set a display name for better debugging
Textbox.displayName = 'Textbox';

export default Textbox;
