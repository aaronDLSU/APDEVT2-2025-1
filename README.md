# APDEVT2-2025-1

1. run 'npm i'
2. Set up .env file
    - PORT = 3000
    - MONGO_URI = mongodb://localhost:27017/
      
3a. For Mac Users, to start mongodb servers
    
    brew services start mongodb-community@7.0

3b. run 'npm run dev'

4. Delete all files with ._ for Mac users 
        find . -type f -name "._*" -delete
