const { execSync } = require('child_process');
execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m "fix: dynamic owner profile, real-time tenant dashboard metrics, and onboarding guide"', { stdio: 'inherit' });
execSync('git push origin main', { stdio: 'inherit' });
console.log('Push complete!');
