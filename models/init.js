const mongoose = require('mongoose');
   
   // Import models from root models directory
   const User = require('./User');
   // Add other model imports as needed
   
   const initModels = async () => {
     try {
       console.log('Models initialized successfully');
       return true;
     } catch (error) {
       console.error(`Error initializing models: ${error.message}`);
       throw error;
     }
   };
   
   module.exports = { initModels };
   