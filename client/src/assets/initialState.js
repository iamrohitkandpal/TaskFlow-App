// Replace data.js with this minimal initial state

export const initialUserState = {
  _id: "",
  name: "",
  title: "",
  role: "",
  email: "",
  isAdmin: false,
  tasks: [],
  isActive: true,
};

export const initialTaskState = {
  title: "",
  date: new Date(),
  priority: "normal",
  stage: "todo",
  assets: [],
  team: [],
  isTrashed: false,
  activities: [],
  subTasks: [],
};

export const initialProjectState = {
  name: "",
  description: "",
  startDate: new Date(),
  endDate: null,
  team: [],
};