import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Textbox from "../components/Textbox";
import Button from "../components/Button";
import { useDispatch, useSelector } from "react-redux";
import { useLoginMutation } from "../redux/slices/api/authApiSlice";
import { toast } from "sonner";
import { setCredentials } from "../redux/slices/authSlice";
import Loader from "../components/Loader";
import { validateLoginCredentials } from "../utils/validation";

const Login = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Redirect if already logged in
  useEffect(() => {
    // Check both Redux state and localStorage
    const userInfo = localStorage.getItem("userInfo");
    if (user || userInfo) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleOnSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await login(data).unwrap();
      if (res?.status) {
        dispatch(setCredentials(res));

        // Process any pending offline changes
        const syncService = await import("../services/syncService");
        syncService.syncDataWithServer(res.token);

        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.data?.message ||
        error.error ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center flex-col lg:flex-row bg-[#f3f4f6]">
      <div className="w-full md:w-auto flex gap-0 md:gap-40 flex-col md:flex-row items-center justify-center">
        {/* Left Side */}
        <div className="h-full w-full lg:w-2/3 flex flex-col items-center justify-center">
          <div className="w-full md:max-w-lg 2xl:max-w-3xl flex flex-col items-center justify-center gap-5 md:gap-y-10 2xl:-mt-20">
            <span className="flex gap-1 py-1 px-3 border rounded-full text-sm md:text-base border-gray-300 text-gray-600">
              Manage all your work at one place!
            </span>
            <p className="flex gap-0 md:gap-4 text-4xl md:text-6xl 2xl:text-7xl font-black text-center text-blue-700">
              <span>Task</span>
              <span>Flow</span>
            </p>

            <div>
              <div className="circle rotate-in-up-left"></div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/3 p-4 md:p-1 flex flex-col justify-center items-center">
          <form
            onSubmit={handleSubmit(handleOnSubmit)}
            className="form-container w-full md:w-[450px] flex flex-col gap-y-8 bg-white px-10 pt-14 pb-14"
          >
            <div className="">
              <p className="text-blue-600 text-3xl font-bold text-center">
                Hey! How you doin'?
              </p>
              <p className="text-center text-gray-700 text-base">
                Keep all your information safe.
              </p>
            </div>

            <div className="flex flex-col gap-y-5">
              <Textbox
                type="email"
                name="email"
                label="Email Address"
                placeholder="Email Please"
                register={register("email", {
                  required: "Email is required",
                })}
                error={errors.email ? errors.email.message : ""}
                className="w-full rounded-full"
              />
              <Textbox
                type="password"
                name="password"
                label="Password"
                placeholder="Password Please"
                register={register("password", {
                  required: "Password is required",
                })}
                error={errors.password ? errors.password.message : ""}
                className="w-full rounded-full"
              />

              <span className="text-sm text-gray-500 hover:text-blue-600 hover:underline cursor-pointer transition-all">
                Forget Password?
              </span>

              {isLoading || loading ? (
                <Loader />
              ) : (
                <Button
                  type="submit"
                  label="Login"
                  className="w-full rounded-full bg-blue-600 h-10 text-white transition-all hover:bg-blue-700"
                />
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
