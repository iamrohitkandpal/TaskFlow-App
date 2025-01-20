import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import Notice from "../models/notification.model.js";
import mongoose from "mongoose";

export const createTask = async (req, res) => {
  try {
    const { userId } = req.user;
    const { title, team, stage, date, priority, assets } = req.body;
    // console.log("req.body", req.body);

    // Validate and convert `team` array elements to ObjectId
    const teamObjectIds = Array.isArray(team)
      ? team
          .map((member) => member._id) // Extract `_id` field
          .filter(mongoose.Types.ObjectId.isValid) // Validate ObjectId
          .map((memberId) => new mongoose.Types.ObjectId(memberId)) // Convert to ObjectId
      : [];

    // console.log("teamObjectIds", teamObjectIds);

    let text = "New task has been assigned to you";
    if (teamObjectIds.length > 1) {
      text += ` and ${teamObjectIds.length - 1} others.`;
    }

    text += ` Task Priority is ${priority}, so work on it accordingly. Assigned on ${new Date(
      date
    ).toDateString()}. Thank You`;

    const activity = {
      type: "assigned",
      activity: text,
      by: userId,
    };

    const task = await Task.create({
      title,
      team: teamObjectIds,
      stage: stage?.toLowerCase(),
      date,
      priority: priority?.toLowerCase(),
      assets,
      activities: activity,
    });

    await Notice.create({
      team: teamObjectIds,
      text,
      task: task._id,
    });

    // Update user's tasks array
    await User.updateMany(
      { _id: { $in: teamObjectIds } },
      { $push: { tasks: task._id } }
    );

    res
      .status(200)
      .json({ status: true, message: "Task assigned successfully." });
  } catch (error) {
    console.error("Error in createTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const duplicateTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    const newTask = await Task.create({
      ...task.toObject(),
      title: `${task.title} - Duplicate`,
      _id: undefined, // Remove the original ID for duplication
    });

    // Alert users of the task
    let text = "New task has been assigned to you";
    if (task.team?.length > 1) {
      text += ` and ${task.team.length - 1} others.`;
    }

    text += ` Task Priority is ${
      task.priority
    }, so work on it accordingly. Assigned on ${new Date(
      task.date
    ).toDateString()}. Thank You`;

    await Notice.create({
      team: task.team,
      text,
      task: newTask._id,
    });

    res
      .status(200)
      .json({ status: true, message: "Task duplicated successfully." });
  } catch (error) {
    console.error("Error in duplicateTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const postTaskActivity = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { type, activity } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    task.activities.push({ type, activity, by: userId });
    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Activity posted successfully." });
  } catch (error) {
    console.error("Error in postTaskActivity:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const dashBoardStatistics = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;

    const allTasks = isAdmin
      ? await Task.find({
          isTrashed: false,
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 })
      : await Task.find({
          isTrashed: false,
          team: { $all: [userId] },
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 });

    const users = await User.find({ isActive: true })
      .select("name title role isAdmin")
      .limit(10)
      .sort({ _id: -1 });

    const groupTasks = allTasks.reduce((result, task) => {
      const stage = task.stage;

      if (!result[stage]) {
        result[stage] = 1;
      } else {
        result[stage] += 1;
      }

      return result;
    }, {});

    const groupData = Object.entries(
      allTasks.reduce((result, task) => {
        const { priority } = task;

        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    // calculate total tasks
    const totalTasks = allTasks?.length;
    const last10Task = allTasks?.slice(0, 10);

    const summary = {
      totalTasks,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupTasks,
      graphData: groupData,
    };

    res.status(200).json({
      status: true,
      message: "Successfully",
      ...summary,
    });
  } catch (error) {
    console.error("Error in dashboardStatistics:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { stage, isTrashed } = req.query;
    const { userId, isAdmin } = req.user;

    const query = isAdmin
      ? { isTrashed: isTrashed === "true" }
      : { isTrashed: isTrashed === "true", team: { $all: [userId] } };
    if (stage) query.stage = stage;

    const tasks = isAdmin
      ? await Task.find(query)
          .populate({
            path: "team",
            select: "name title email",
          })
          .sort({ _id: -1 })
      : await Task.find(query)
          .populate({
            path: "team",
            select: "name title email",
          })
          .sort({ _id: -1 });

    res.status(200).json({ status: true, tasks });
  } catch (error) {
    console.error("Error in getTasks:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email",
      })
      .populate({
        path: "activities.by",
        select: "name",
      });

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    res.status(200).json({ status: true, task });
  } catch (error) {
    console.error("Error in getTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date } = req.body;
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    task.subTasks.push({ title, date, tag });
    await task.save();

    res
      .status(200)
      .json({ status: true, message: "SubTask added successfully." });
  } catch (error) {
    console.error("Error in createSubTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    Object.assign(task, {
      title,
      date,
      team,
      stage: stage?.toLowerCase(),
      priority: priority?.toLowerCase(),
      assets,
    });

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Task updated successfully." });
  } catch (error) {
    console.error("Error in updateTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    task.isTrashed = true;
    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Task trashed successfully." });
  } catch (error) {
    console.error("Error in trashTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;

    if (actionType === "delete") {
      await Task.findByIdAndDelete(id);
    } else if (actionType === "deleteAll") {
      await Task.deleteMany({ isTrashed: true });
    } else if (actionType === "restore") {
      const task = await Task.findById(id);
      if (task) {
        task.isTrashed = false;
        await task.save();
      }
    } else if (actionType === "restoreAll") {
      await Task.updateMany(
        { isTrashed: true },
        { $set: { isTrashed: false } }
      );
    }

    res
      .status(200)
      .json({ status: true, message: "Operation performed successfully." });
  } catch (error) {
    console.error("Error in deleteRestoreTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};
