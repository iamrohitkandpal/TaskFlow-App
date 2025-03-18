import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deployBackend() {
  console.log('🚀 TaskFlow Backend Deployment Preparation');
  console.log('===========================================');
  
  // 1. Check environment variables
  console.log('📋 Checking environment setup...');
  
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️ No .env file found. This is required for deployment.');
    const createEnv = await question('Would you like to create one now? (y/n): ');
    
    if (createEnv.toLowerCase() === 'y') {
      const mongodbUrl = await question('MongoDB Atlas connection string: ');
      const jwtSecret = await question('JWT secret key (or press enter to generate one): ');
      const clientUrl = await question('Client URL (e.g. https://taskflow-app.netlify.app): ');
      
      // Generate JWT secret if not provided
      const finalJwtSecret = jwtSecret || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const envContent = `MONGODB_URL=${mongodbUrl}
JWT_SECRET=${finalJwtSecret}
CLIENT_URL=${clientUrl}
NODE_ENV=production`;
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file created successfully');
    } else {
      console.log('❌ .env file is required for deployment. Exiting...');
      rl.close();
      return;
    }
  } else {
    console.log('✅ .env file found');
  }
  
  // 2. Select deployment platform
  console.log('\n📦 Select deployment platform:');
  console.log('1. Railway');
  console.log('2. Render');
  console.log('3. Cyclic');
  
  const platform = await question('Enter your choice (1-3): ');
  
  // 3. Prepare for deployment
  console.log('\n🔄 Preparing for deployment...');
  
  try {
    // Create platform-specific configuration files
    switch (platform) {
      case '1': // Railway
        console.log('🚂 Configuring for Railway deployment...');
        
        // Create railway.json
        const railwayConfig = {
          "$schema": "https://railway.app/railway.schema.json",
          "build": {
            "builder": "NIXPACKS",
            "buildCommand": "npm install"
          },
          "deploy": {
            "startCommand": "npm start",
            "healthcheckPath": "/health",
            "healthcheckTimeout": 100,
            "restartPolicyType": "ON_FAILURE",
            "restartPolicyMaxRetries": 10
          }
        };
        
        fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
        console.log('✅ Created railway.json configuration');
        
        console.log('\nTo deploy to Railway:');
        console.log('1. Install Railway CLI: npm i -g @railway/cli');
        console.log('2. Run: railway login');
        console.log('3. Run: railway up');
        break;
        
      case '2': // Render
        console.log('🔄 Configuring for Render deployment...');
        
        // Create render.yaml
        const renderConfig = `services:
  - type: web
    name: taskflow-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URL
        sync: false
      - key: JWT_SECRET
        sync: false`;
        
        fs.writeFileSync('render.yaml', renderConfig);
        console.log('✅ Created render.yaml configuration');
        
        console.log('\nTo deploy to Render:');
        console.log('1. Create a new Web Service on render.com');
        console.log('2. Connect your GitHub repository');
        console.log('3. Use the "render.yaml" configuration');
        break;
        
      case '3': // Cyclic
        console.log('🔄 Configuring for Cyclic deployment...');
        
        // Update package.json for Cyclic
        const pkgJsonPath = path.join(process.cwd(), 'package.json');
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        
        // Ensure engines are specified for Node.js version
        if (!pkgJson.engines) {
          pkgJson.engines = {
            "node": ">=18.0.0"
          };
        }
        
        // Save updated package.json
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
        console.log('✅ Updated package.json for Cyclic deployment');
        
        console.log('\nTo deploy to Cyclic:');
        console.log('1. Install Cyclic CLI: npm i -g @cyclic.sh/cli');
        console.log('2. Run: cyclic login');
        console.log('3. Run: cyclic deploy');
        break;
        
      default:
        console.log('❌ Invalid platform selection');
    }
    
    // Create a health check endpoint
    console.log('\n🔄 Creating health check endpoint...');
    const indexPath = path.join(process.cwd(), 'index.js');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (!indexContent.includes('/health')) {
      // Add health check endpoint if it doesn't exist
      const routeCode = `\n// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});\n`;
      
      // Find a good place to insert the code (before error handling middleware)
      const insertPosition = indexContent.indexOf('app.use(routeNotFound)');
      if (insertPosition !== -1) {
        indexContent = indexContent.slice(0, insertPosition) + routeCode + indexContent.slice(insertPosition);
        fs.writeFileSync(indexPath, indexContent);
        console.log('✅ Added health check endpoint to index.js');
      } else {
        console.log('⚠️ Could not add health check endpoint automatically');
      }
    } else {
      console.log('✅ Health check endpoint already exists');
    }
    
    console.log('\n🎉 Backend deployment preparation completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error);
  } finally {
    rl.close();
  }
}

deployBackend().catch(console.error);