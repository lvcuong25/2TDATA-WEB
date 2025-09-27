# MongoDB Connection Strings

## Database: 2TDATA-P

### User Information
- **Username:** `2tdata_p_user`
- **Password:** `2tdata_p@2024!`
- **Database:** `2TDATA-P`
- **Host:** `127.0.0.1` (localhost)
- **Port:** `27017`

### Connection Strings

#### 1. MongoDB URI (Standard)
```
mongodb://2tdata_p_user:2tdata_p@2024!@127.0.0.1:27017/2TDATA-P
```

#### 2. MongoDB URI (URL Encoded)
```
mongodb://2tdata_p_user:2tdata_p%402024%21@127.0.0.1:27017/2TDATA-P
```

#### 3. MongoDB URI with Options
```
mongodb://2tdata_p_user:2tdata_p@2024!@127.0.0.1:27017/2TDATA-P?authSource=2TDATA-P&retryWrites=true&w=majority
```

### Connection Examples by Language

#### Node.js (Mongoose)
```javascript
const mongoose = require('mongoose');

const connectionString = 'mongodb://2tdata_p_user:2tdata_p@2024!@127.0.0.1:27017/2TDATA-P';

mongoose.connect(connectionString, {
  authSource: '2TDATA-P',
  retryWrites: true,
  w: 'majority'
});
```

#### Python (PyMongo)
```python
from pymongo import MongoClient

connection_string = "mongodb://2tdata_p_user:2tdata_p@2024!@127.0.0.1:27017/2TDATA-P"

client = MongoClient(connection_string, authSource='2TDATA-P')
db = client['2TDATA-P']
```

#### Java (MongoDB Driver)
```java
String connectionString = "mongodb://2tdata_p_user:2tdata_p@2024!@127.0.0.1:27017/2TDATA-P?authSource=2TDATA-P";

MongoClient mongoClient = MongoClients.create(connectionString);
MongoDatabase database = mongoClient.getDatabase("2TDATA-P");
```

#### C# (.NET)
```csharp
string connectionString = "mongodb://2tdata_p_user:2tdata_p@2024!@127.0.0.1:27017/2TDATA-P?authSource=2TDATA-P";

var client = new MongoClient(connectionString);
var database = client.GetDatabase("2TDATA-P");
```

### Environment Variables
```bash
# .env file
MONGODB_URI=mongodb://2tdata_p_user:2tdata_p@2024!@127.0.0.1:27017/2TDATA-P
MONGODB_DATABASE=2TDATA-P
MONGODB_USERNAME=2tdata_p_user
MONGODB_PASSWORD=2tdata_p@2024!
MONGODB_HOST=127.0.0.1
MONGODB_PORT=27017
```

### Test Connection
```bash
# Using mongosh
mongosh -u 2tdata_p_user -p 2tdata_p@2024! --authenticationDatabase 2TDATA-P 2TDATA-P

# Using mongo (if available)
mongo -u 2tdata_p_user -p 2tdata_p@2024! --authenticationDatabase 2TDATA-P 2TDATA-P
```

### Security Notes
- Database name is case-sensitive: `2TDATA-P`
- Authentication source is the same as database name: `2TDATA-P`
- User has readWrite permissions only on this specific database
- Connection is restricted to localhost (127.0.0.1)
- Use URL encoding for special characters in password (@ becomes %40, ! becomes %21)
