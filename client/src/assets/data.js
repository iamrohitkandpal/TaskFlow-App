export const tasks = [
  {
    _id: "1",
    title: "Design Dashboard Layout",
    description: "Create a responsive dashboard layout for the admin panel",
    priority: "high",
    stage: "todo",
    assignee: { _id: "user1", name: "John Doe", email: "john@example.com" },
    team: [{ _id: "user1", name: "John Doe", email: "john@example.com" }],
    date: new Date().toISOString(),
    activities: [],
    assets: [],
    subTasks: []
  },
  {
    _id: "2",
    title: "Implement Authentication API",
    description: "Create endpoints for user authentication and authorization",
    priority: "medium",
    stage: "in-progress",
    assignee: { _id: "user2", name: "Jane Smith", email: "jane@example.com" },
    team: [{ _id: "user2", name: "Jane Smith", email: "jane@example.com" }],
    date: new Date().toISOString(),
    activities: [],
    assets: [],
    subTasks: []
  },
  {
    _id: "3",
    title: "Write Unit Tests",
    description: "Create unit tests for the core functionalities",
    priority: "normal",
    stage: "completed",
    assignee: { _id: "user3", name: "Alex Johnson", email: "alex@example.com" },
    team: [{ _id: "user3", name: "Alex Johnson", email: "alex@example.com" }],
    date: new Date().toISOString(),
    activities: [],
    assets: [],
    subTasks: []
  }
];

export const summary = {
  tasks: {
    total: 12,
    completed: 3,
    pending: 5,
    inProgress: 4
  },
  users: [
    { _id: "user1", name: "John Doe", email: "john@example.com", role: "Admin", isActive: true, createdAt: new Date().toISOString() },
    { _id: "user2", name: "Jane Smith", email: "jane@example.com", role: "Developer", isActive: true, createdAt: new Date().toISOString() },
    { _id: "user3", name: "Alex Johnson", email: "alex@example.com", role: "QA", isActive: true, createdAt: new Date().toISOString() },
    { _id: "user4", name: "Sara Wilson", email: "sara@example.com", role: "Designer", isActive: false, createdAt: new Date().toISOString() }
  ]
};