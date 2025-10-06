# Hướng dẫn xem Records trên Metabase

## 🎯 Tình trạng hiện tại

✅ **Hệ thống hoạt động hoàn hảo!** Records đã được sync đúng cách đến Metabase tables.

### 📊 Data đã có sẵn:
- **5 schemas** đã được tạo với naming convention: `quang_trung_*`
- **4 records** trong schema `quang_trung_metabase_check_1759415127233_d8ac4b66`
- **Table**: `metabase_products_f8c23127` với data:
  - iPhone 15 (Price: 999, Category: Electronics)
  - MacBook Pro (Price: 1999, Category: Electronics)  
  - Nike Air Max (Price: 120, Category: Clothing)
  - JavaScript Guide (Price: 45, Category: Books)

## 🔗 Cách kết nối Metabase

### Bước 1: Mở Metabase UI
```
http://localhost:3000
```

### Bước 2: Thêm PostgreSQL Database
1. Vào **Admin** > **Databases**
2. Click **"Add database"**
3. Chọn **"PostgreSQL"**

### Bước 3: Điền thông tin kết nối
```
Host: localhost
Port: 5432
Database: 2tdata_postgres
Username: postgres
Password: [your password]
```

### Bước 4: Test và Save
1. Click **"Test connection"**
2. Nếu thành công, click **"Save"**

## 📋 Cách xem Data

### Phương pháp 1: Browse Tables
1. Sau khi kết nối, bạn sẽ thấy các schemas:
   - `quang_trung_metabase_check_1759415127233_d8ac4b66`
   - `quang_trung_table_test_database_*`
   - `quang_trung_test_schema_*`

2. Click vào schema `quang_trung_metabase_check_1759415127233_d8ac4b66`
3. Click vào table `metabase_products_f8c23127`
4. Bạn sẽ thấy 4 records với data đầy đủ

### Phương pháp 2: Custom SQL Query
1. Vào **SQL Editor**
2. Chạy query:
```sql
SELECT * FROM "quang_trung_metabase_check_1759415127233_d8ac4b66"."metabase_products_f8c23127";
```

### Phương pháp 3: Native Query
1. Vào **Browse Data**
2. Chọn **"Raw SQL"**
3. Chạy query:
```sql
SELECT 
  "Product_Name",
  "Price", 
  "Category",
  "created_at"
FROM "quang_trung_metabase_check_1759415127233_d8ac4b66"."metabase_products_f8c23127"
ORDER BY "created_at";
```

## 🔍 Troubleshooting

### Nếu không thấy data:

#### 1. Kiểm tra kết nối database
```sql
-- Chạy query này để kiểm tra schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'quang_trung%';
```

#### 2. Kiểm tra tables trong schema
```sql
-- Thay thế schema_name bằng schema thực tế
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'quang_trung_metabase_check_1759415127233_d8ac4b66';
```

#### 3. Kiểm tra records
```sql
-- Thay thế schema và table name
SELECT COUNT(*) 
FROM "quang_trung_metabase_check_1759415127233_d8ac4b66"."metabase_products_f8c23127";
```

### Nếu Metabase không kết nối được:

#### 1. Kiểm tra PostgreSQL service
```bash
# Kiểm tra PostgreSQL có chạy không
netstat -an | findstr 5432
```

#### 2. Kiểm tra credentials
- Username: `postgres`
- Password: [password bạn đã set]
- Database: `2tdata_postgres`

#### 3. Kiểm tra firewall
- Port 5432 phải được mở
- PostgreSQL phải accept connections từ localhost

## 📊 Data Structure

### Table Structure:
```
id (character varying) - Primary key
table_id (character varying) - Reference to main table
user_id (character varying) - User who created record
site_id (character varying) - Site context
created_at (timestamp) - Creation time
updated_at (timestamp) - Last update time
Product_Name (text) - Product name
Price (numeric) - Product price
Category (text) - Product category
```

### Sample Data:
```
ID: 43063e74-dba6-4d41-a6fa-421ce7b5c1a8
Product_Name: iPhone 15
Price: 999
Category: Electronics
Created: 2025-10-02 21:25:27
```

## 🎯 Tạo Dashboard

### Bước 1: Tạo Dashboard mới
1. Vào **Dashboards** > **New Dashboard**
2. Đặt tên: "2TDATA Products"

### Bước 2: Thêm Charts
1. **Product Count by Category**:
```sql
SELECT "Category", COUNT(*) as count
FROM "quang_trung_metabase_check_1759415127233_d8ac4b66"."metabase_products_f8c23127"
GROUP BY "Category";
```

2. **Average Price by Category**:
```sql
SELECT "Category", AVG("Price") as avg_price
FROM "quang_trung_metabase_check_1759415127233_d8ac4b66"."metabase_products_f8c23127"
GROUP BY "Category";
```

3. **All Products Table**:
```sql
SELECT "Product_Name", "Price", "Category", "created_at"
FROM "quang_trung_metabase_check_1759415127233_d8ac4b66"."metabase_products_f8c23127"
ORDER BY "created_at" DESC;
```

## ✅ Kết luận

**Hệ thống hoạt động hoàn hảo!** Records đã được sync đúng cách đến Metabase tables. Bạn chỉ cần:

1. ✅ Kết nối Metabase với PostgreSQL database
2. ✅ Browse đến schema `quang_trung_metabase_check_1759415127233_d8ac4b66`
3. ✅ Xem table `metabase_products_f8c23127`
4. ✅ Thấy 4 records với data đầy đủ

**Data đã sẵn sàng để phân tích trên Metabase!**

---

*Hướng dẫn này được tạo sau khi verify thành công việc sync data từ hệ thống 2TDATA đến Metabase tables.*



