/**
 * MongoDB Atlas Connection & Setup Script
 * 
 * This script validates MongoDB Atlas connection,
 * saves connection strings to .env, and creates
 * performance-optimized indexes for the TaskFlow application.
 */

import mongoose from 'mongoose';
import readline from 'readline';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupMongoDBAtlas() {
  console.log('🔧 MongoDB Atlas Connection & Setup Script 🔧');
  console.log('===========================================');
  
  // Get connection string from .env or user input
  let connectionString = process.env.MONGODB_URL;
  
  if (!connectionString) {
    console.log('⚠️ No MongoDB connection string found in .env file');
    connectionString = await question('Please enter your MongoDB Atlas connection string: ');
    
    // Save to .env if user wants to
    const saveToEnv = await question('Do you want to save this connection string to .env? (y/N): ');
    
    if (saveToEnv.toLowerCase() === 'y') {
      try {
        const envPath = path.join(process.cwd(), '.env');
        let envContent = '';
        
        try {
          envContent = await fs.readFile(envPath, 'utf-8');
        } catch (err) {
          // File doesn't exist, create it
          envContent = '';
        }
        
        // Update or add the connection string in .env
        if (envContent.includes('MONGODB_URL=')) {
          envContent = envContent.replace(
            /MONGODB_URL=.*/,
            `MONGODB_URL=${connectionString}`
          );
        } else {
          envContent += `\nMONGODB_URL=${connectionString}\n`;
        }
        
        await fs.writeFile(envPath, envContent);
        console.log('✅ Connection string saved to .env file');
      } catch (error) {
        console.error('❌ Error saving to .env file:', error);
      }
    }
  }
  
  // Test connection
  console.log('🔄 Testing MongoDB Atlas connection...');
  try {
    const connection = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📊 Connected to database: ${connection.connection.db.databaseName}`);
    
    // Set up indexes
    const setupIndexes = await question('Do you want to set up database indexes for optimal performance? (Y/n): ');
    
    if (setupIndexes.toLowerCase() !== 'n') {
      console.log('🔄 Setting up database indexes...');
      
      // Import models dynamically
      const { default: Task } = await import('../models/task.model.js');
      const { default: User } = await import('../models/user.model.js');
      const { default: Project } = await import('../models/project.model.js');
      const { default: Activity } = await import('../models/activity.model.js');
      
      // Create indexes
      console.log('Creating text indexes for search functionality...');
      await Task.collection.createIndex(
        { title: 'text', description: 'text' },
        { name: 'task_text_search', background: true }
      );
      
      // Create index for tasks by project and status
      await Task.collection.createIndex(
        { projectId: 1, stage: 1 },
        { background: true }
      );
      
      // Create index for tasks by assignee
      await Task.collection.createIndex(
        { 'team._id': 1 },
        { background: true }
      );
      
      // Create index for users by skills
      await User.collection.createIndex(
        { skills: 1 },
        { background: true }
      );
      
      // Create index for activities
      await Activity.collection.createIndex(
        { taskId: 1, createdAt: -1 },
        { background: true }
      );
      
      console.log('✅ All indexes created successfully!');
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('Please check your connection string and try again.');
  } finally {
    await mongoose.disconnect();
    console.log('📡 MongoDB connection closed');
    rl.close();
  }
}

setupMongoDBAtlas().catch(console.error);