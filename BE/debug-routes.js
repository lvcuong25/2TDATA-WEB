import express from 'express';
import membersRouter from './src/router/members.routes.js';

const app = express();

// Test route registration
app.use('/api', membersRouter);

// List all registered routes
console.log('🔍 Registered routes:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`   ${middleware.route.methods} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log(`   ${handler.route.methods} ${handler.route.path}`);
      }
    });
  }
});

console.log('\n✅ Route registration test completed');
