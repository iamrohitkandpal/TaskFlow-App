/**
 * Frontend deployment preparation script
 * 
 * This script prepares the TaskFlow frontend for deployment to various
 * hosting platforms (Vercel, Netlify, GitHub Pages) by:
 * 
 * 1. Verifying environment configuration
 * 2. Building the production bundle
 * 3. Creating platform-specific configuration files
 * 4. Setting up client-side routing support
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deployFrontend() {
  console.log('🚀 TaskFlow Frontend Deployment Preparation');
  console.log('===========================================');
  
  // Check environment variables for API URL
  console.log('📋 Checking environment setup...');
  
  let apiUrl = '';
  const envPath = path.join(process.cwd(), '.env');
  const prodEnvPath = path.join(process.cwd(), '.env.production');
  
  if (!fs.existsSync(envPath) && !fs.existsSync(prodEnvPath)) {
    console.log('⚠️ No .env or .env.production file found');
    apiUrl = await question('Please enter your API base URL (e.g. https://api.taskflow-app.com): ');
    
    // Create production env file with API URL
    fs.writeFileSync(prodEnvPath, `VITE_API_URL=${apiUrl}\n`);
    console.log('✅ Created .env.production with API URL');
  } else {
    console.log('✅ Environment file found');
  }
  
  // 2. Select deployment platform
  console.log('\n📦 Select deployment platform:');
  console.log('1. Vercel');
  console.log('2. Netlify');
  console.log('3. GitHub Pages');
  
  const platform = await question('Enter your choice (1-3): ');
  
  // 3. Prepare build with platform-specific configurations
  console.log('\n🔄 Building production bundle...');
  
  try {
    // Run build
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
    
    const distDir = path.resolve('./dist');
    
    // Platform-specific configurations
    switch (platform) {
      case '1': // Vercel
        console.log('\n🔧 Configuring for Vercel deployment...');
        
        // Create vercel.json
        const vercelConfig = {
          "version": 2,
          "builds": [
            {
              "src": "dist/**",
              "use": "@vercel/static"
            }
          ],
          "routes": [
            { "handle": "filesystem" },
            { "src": "/(.*)", "dest": "/index.html" }
          ]
        };
        
        fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
        console.log('✅ Created vercel.json configuration');
        
        console.log('\nTo deploy to Vercel:');
        console.log('1. Install Vercel CLI: npm i -g vercel');
        console.log('2. Run: vercel login');
        console.log('3. Run: vercel --prod');
        break;
        
      case '2': // Netlify
        console.log('\n🔧 Configuring for Netlify deployment...');
        
        // Create netlify.toml
        const netlifyConfig = `[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
        
        fs.writeFileSync('netlify.toml', netlifyConfig);
        console.log('✅ Created netlify.toml configuration');
        
        // Create _redirects file in dist for Netlify
        fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200');
        console.log('✅ Created _redirects file for client-side routing');
        
        console.log('\nTo deploy to Netlify:');
        console.log('1. Install Netlify CLI: npm i -g netlify-cli');
        console.log('2. Run: netlify login');
        console.log('3. Run: netlify deploy --prod');
        break;
        
      case '3': // GitHub Pages
        console.log('\n🔧 Configuring for GitHub Pages deployment...');
        
        // Create 404.html for GitHub Pages routing
        fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
        console.log('✅ Created 404.html for client-side routing on GitHub Pages');
        
        // Add .nojekyll file to prevent Jekyll processing
        fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
        
        // Check if package.json has gh-pages config
        const pkgJsonPath = path.join(process.cwd(), 'package.json');
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        
        if (!pkgJson.homepage) {
          const githubRepo = await question('Enter your GitHub repository URL (e.g. https://github.com/username/repo): ');
          pkgJson.homepage = githubRepo.replace('github.com', 'github.io').replace('https://github.io', 'https://').replace(/\.git$/, '');
          
          fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
          console.log(`✅ Added homepage: ${pkgJson.homepage} to package.json`);
        }
        
        console.log('\nTo deploy to GitHub Pages:');
        console.log('1. Install gh-pages: npm i -D gh-pages');
        console.log('2. Add to package.json scripts: "deploy": "gh-pages -d dist"');
        console.log('3. Run: npm run deploy');
        break;
        
      default:
        console.log('❌ Invalid platform selection');
    }
    
    console.log('\n🎉 Frontend build and configuration completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
  } finally {
    rl.close();
  }
}

deployFrontend().catch(console.error);