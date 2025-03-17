import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Preparing TaskFlow frontend for deployment...');

// Ensure environment variables are properly set
const envFile = path.resolve('./production.env');
if (fs.existsSync(envFile)) {
  console.log('✅ Using production environment variables');
  // Copy production env to .env for the build
  fs.copyFileSync(envFile, '.env');
} else {
  console.log('⚠️ No production.env file found, using current environment');
}

try {
  // Generate production build
  console.log('📦 Building production bundle...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Create redirects file for Netlify to support client-side routing
  const distDir = path.resolve('./dist');
  const redirectsFile = path.join(distDir, '_redirects');
  fs.writeFileSync(redirectsFile, '/* /index.html 200');
  console.log('✅ Created _redirects file for client-side routing');
  
  // Create netlify.toml for advanced configuration
  const netlifyConfig = `
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/api/*"
  to = "${process.env.VITE_API_URL || 'https://api.taskflow-app.com'}/api/:splat"
  status = 200
  force = true
`;
  
  fs.writeFileSync(path.join(distDir, '../netlify.toml'), netlifyConfig);
  console.log('✅ Created netlify.toml configuration');
  
  console.log('🎉 Frontend build completed successfully!');
  console.log('\nNext steps:');
  console.log('1️⃣ Deploy the dist/ folder to your hosting service');
  console.log('2️⃣ Ensure your API URL is properly configured in environment variables');
  console.log('3️⃣ Test the deployed application thoroughly');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}