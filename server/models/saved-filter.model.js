import mongoose from 'mongoose';

const savedFilterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    trim: true
  },
  filters: {
    priority: String,
    status: String,
    assignee: mongoose.Schema.Types.ObjectId,
    projectId: mongoose.Schema.Types.ObjectId,
    dueDate: {
      from: Date,
      to: Date
    },
    tags: [String]
  }
}, { timestamps: true });

const SavedFilter = mongoose.model('SavedFilter', savedFilterSchema);

export default SavedFilter;