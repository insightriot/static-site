const chokidar = require('chokidar');
const { spawn } = require('child_process');
const liveServer = require('live-server');
const path = require('path');

// Configure live-server
const serverParams = {
  port: 8080,
  root: path.join(__dirname, 'docs'),
  open: true,
  file: 'index.html',
  wait: 1000,
  logLevel: 2
};

// Start the live server
liveServer.start(serverParams);
console.log('Live server started on http://localhost:8080');

// Watch for changes in the src directory
const watcher = chokidar.watch('src/**/*', {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

// Build the site initially
runBuild();

// Watch for changes and rebuild
watcher
  .on('add', path => {
    console.log(`File ${path} has been added`);
    runBuild();
  })
  .on('change', path => {
    console.log(`File ${path} has been changed`);
    runBuild();
  })
  .on('unlink', path => {
    console.log(`File ${path} has been removed`);
    runBuild();
  });

function runBuild() {
  console.log('Rebuilding site...');
  const build = spawn('node', ['build.js'], { stdio: 'inherit' });
  
  build.on('close', code => {
    if (code === 0) {
      console.log('Build completed successfully');
    } else {
      console.error(`Build failed with code ${code}`);
    }
  });
}
