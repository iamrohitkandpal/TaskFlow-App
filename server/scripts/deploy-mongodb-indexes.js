// Script to deploy all MongoDB indexes to ensure proper performance
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import Project from '../models/project.model.js';
import SearchIndex from '../models/search-index.model.js';
import Integration from '../models/integration.model.js';
import SavedFilter from '../models/saved-filter.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  console.log('Creating MongoDB indexes...');
  
  try {
    // Task indexes
    await Task.createIndexes();
    console.log('✅ Task indexes created');
    
    // Create text indexes for search functionality
    await Task.collection.createIndex(
      { title: "text", description: "text" },
      { name: "task_text_search" }
    );
    console.log('✅ Task text search index created');
    
    // Task indexes for efficient filtering
    await Task.collection.createIndex(
      { projectId: 1, stage: 1, isTrashed: 1 },
      { background: true }
    );
    console.log('✅ Task filtering index created');
    
    // Index for rapid task searches
    await Task.collection.createIndex(
      { title: "text", description: "text" },
      { weights: { title: 10, description: 5 }, name: "task_search_index" }
    );
    console.log('✅ Task search index created');
    
    // User indexes
    await User.createIndexes();
    console.log('✅ User indexes created');
    
    // Create index on user email for fast lookups
    await User.collection.createIndex(
      { email: 1 },
      { unique: true }
    );
    console.log('✅ User email index created');
    
    // Create index on user skills for skills-based assignment
    await User.collection.createIndex({ skills: 1 });
    console.log('✅ User skills index created');
    
    // Activity indexes
    await Activity.createIndexes();
    console.log('✅ Activity indexes created');
    
    // Create compound index for fast activity filtering
    await Activity.collection.createIndex(
      { userId: 1, timestamp: -1 }
    );
    console.log('✅ Activity filtering index created');
    
    // Index for activity dashboard queries
    await Activity.collection.createIndex(
      { userId: 1, timestamp: -1, type: 1 },
      { background: true }
    );
    console.log('✅ Activity dashboard index created');
    
    // Project indexes
    await Project.createIndexes();
    console.log('✅ Project indexes created');
    
    // Search index
    await SearchIndex.createIndexes();
    console.log('✅ Search index created');
    
    // Integration indexes
    await Integration.createIndexes();
    console.log('✅ Integration indexes created');
    
    // Saved filter indexes
    await SavedFilter.createIndexes();
    console.log('✅ Saved filter indexes created');
    
    console.log('✅ All indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the index creation
(async () => {
  if (await connectDB()) {
    await createIndexes();
  }
})();