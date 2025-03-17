import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask a question and get user input
const ask = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Main deployment script
const deploy = async () => {
  console.log('🚀 TaskFlow Backend Deployment Script');
  console.log('===================================\n');
  
  // Select deployment platform
  console.log('Select deployment platform:');
  console.log('1. Railway.app');
  console.log('2. Render');
  console.log('3. Cyclic');
  
  const platform = await ask('Enter your choice (1-3): ');
  
  // Check for required files
  const dotEnvExists = fs.existsSync('.env');
  if (!dotEnvExists) {
    console.log('⚠️ .env file not found!');
    const createEnv = await ask('Would you like to create one now? (y/n): ');
    
    if (createEnv.toLowerCase() === 'y') {
      const mongodbUrl = await ask('MongoDB connection string: ');
      const jwtSecret = await ask('JWT secret key: ');
      const clientUrl = await ask('Client URL: ');
      
      const envContent = `
MONGODB_URL=${mongodbUrl}
JWT_SECRET=${jwtSecret}
CLIENT_URL=${clientUrl}
NODE_ENV=production
`;
      
      fs.writeFileSync('.env', envContent.trim());
      console.log('✅ .env file created successfully');
    } else {
      console.log('❌ .env file is required for deployment. Exiting...');
      rl.close();
      return;
    }
  }
  
  // Run tests before deployment
  console.log('\n📋 Running tests before deployment...');
  try {
    // Check if MongoDB connection works
    execSync('node -e "require(\'./utils/connectDB.utils.js\')()"', { stdio: 'inherit' });
    console.log('✅ MongoDB connection successful');
  } catch (error) {
    console.error('❌ MongoDB connection failed. Please check your connection string.');
    const continueAnyway = await ask('Continue with deployment anyway? (y/n): ');
    if (continueAnyway.toLowerCase() !== 'y') {
      rl.close();
      return;
    }
  }
  
  // Create production build
  console.log('\n📦 Creating production build...');
  try {
    // Create any necessary production files
    if (platform === '1') {
      // Railway.app deployment
      console.log('🚂 Preparing for Railway deployment...');
      
      // Ensure railway.json exists
      if (!fs.existsSync('./railway.json')) {
        console.log('⚠️ Creating railway.json file...');
        const railwayConfig = {
          schemaVersion: 2,
          build: {
            builder: "NIXPACKS",
            buildCommand: "npm install"
          },
          deploy: {
            restartPolicyType: "ON_FAILURE",
            restartPolicyMaxRetries: 10,
            startCommand: "npm start"
          }
        };
        
        fs.writeFileSync('./railway.json', JSON.stringify(railwayConfig, null, 2));
        console.log('✅ railway.json created');
      }
      
      console.log('\nTo deploy to Railway.app:');
      console.log('1. Install Railway CLI: npm i -g @railway/cli');
      console.log('2. Login: railway login');
      console.log('3. Link project: railway link');
      console.log('4. Deploy: railway up');
      
    } else if (platform === '2') {
      // Render deployment
      console.log('🖥️ Preparing for Render deployment...');
      
      // Ensure render.yaml exists
      if (!fs.existsSync('./render.yaml')) {
        console.log('⚠️ Creating render.yaml file...');
        const renderConfig = `services:
  - type: web
    name: taskflow-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: ALLOWED_ORIGINS
        value: https://taskflow-app.com
`;
        
        fs.writeFileSync('./render.yaml', renderConfig);
        console.log('✅ render.yaml created');
      }
      
      console.log('\nTo deploy to Render:');
      console.log('1. Create a new Web Service on render.com');
      console.log('2. Connect your GitHub repository');
      console.log('3. Use the "render.yaml" configuration');
      console.log('4. Add environment variables in the Render dashboard');
      
    } else if (platform === '3') {
      // Cyclic deployment
      console.log('🔄 Preparing for Cyclic deployment...');
      
      // Update package.json for Cyclic
      const packageJsonPath = './package.json';
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.engines) {
        packageJson.engines = {
          node: ">=18.0.0",
          npm: ">=9.0.0"
        };
        console.log('✅ Added Node.js engine requirement to package.json');
      }
      
      if (!packageJson.scripts?.start) {
        if (!packageJson.scripts) packageJson.scripts = {};
        packageJson.scripts.start = "node index.js";
        console.log('✅ Added start script to package.json');
      }
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      console.log('\nTo deploy to Cyclic:');
      console.log('1. Install Cyclic CLI: npm i -g @cyclic.sh/cli');
      console.log('2. Login: cyclic login');
      console.log('3. Deploy: cyclic deploy');
    }
    
    // Deploy MongoDB indexes
    console.log('\n📊 Deploying MongoDB indexes...');
    try {
      execSync('node scripts/deploy-mongodb-indexes.js', { stdio: 'inherit' });
      console.log('✅ MongoDB indexes deployed successfully');
    } catch (error) {
      console.error('⚠️ Error deploying MongoDB indexes:', error.message);
      console.log('You may need to run this step manually after deployment');
    }
    
    console.log('\n✅ Deployment preparation completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Follow the platform-specific deployment instructions above');
    console.log('2. Verify API endpoints on the deployed instance');
    console.log('3. Connect your frontend to the deployed backend');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
  }
  
  rl.close();
};

// Run the deployment script
deploy();