const { spawn } = require('child_process');

const command = 'npx';
const args = ['prisma', 'migrate', 'dev'];

const prisma = spawn(command, args, {
  env: {
    ...process.env,
    DATABASE_URL: 'postgresql://neondb_owner:npg_7cIethqNP1bz@ep-spring-pine-aene1dp3-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  },
  shell: true,
});

prisma.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

prisma.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

prisma.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
