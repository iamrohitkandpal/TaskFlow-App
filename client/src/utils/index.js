export const formatDate = (date) => {
  // Get the month, day, and year
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();

  const formattedDate = `${day} ${month} ${year}`;
  // const formattedShortDate = `${day}-${month}-${shortYear}`;

  return formattedDate;
};

export function dateFormatter(dateString) {
  const inputDate = new Date(dateString);

  if (isNaN(inputDate)) {
    return "Invalid Date";
  }

  const year = inputDate.getFullYear();
  const month = String(inputDate.getMonth() + 1).padStart(2, "0");
  const day = String(inputDate.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

export function getInitials(fullName) {
  const names = fullName?.split(" ") || "User Name";

  const initials = names.slice(0, 2).map((name) => name[0].toUpperCase());

  const initialsStr = initials.join("");

  return initialsStr;
}

export const PRIOTITYSTYELS = {
  high: "text-red-600",
  medium: "text-yellow-600",
  normal: "text-blue-600",
  low: "text-green-600",
};

export const TASK_TYPE = {
  todo: "bg-blue-500",
  "in progress": "bg-yellow-500",
  completed: "bg-green-500",
};

export const BGS = [
  "bg-blue-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-green-500",
];
