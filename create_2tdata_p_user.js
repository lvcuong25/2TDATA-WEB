// Create user for 2TDATA-P database
use 2TDATA-P;
db.createUser({
  user: "2tdata_p_user",
  pwd: "2tdata_p@2024!",
  roles: [
    { role: "readWrite", db: "2TDATA-P" }
  ]
});

print("User created successfully for 2TDATA-P database!");
