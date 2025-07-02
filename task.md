# Multi-tenant Architecture Tasks (MCP Sequential Thinking)

## 1. Database & Schema
- [x] Tạo bảng `sites` (id, name, domain, theme_config, logo_url, status, created_at, updated_at)
- [x] Thêm trường `site_id` vào các bảng: users, orders, products, categories, blogs, services, ...
- [ ] Tạo bảng `site_admins` (id, user_id, site_id, role, created_at)
- [ ] Viết script migrate để thêm trường `site_id` vào dữ liệu cũ
- [x] Viết script update dữ liệu cũ, gán `site_id` mặc định cho các bản ghi hiện tại (seed script đã tạo dữ liệu mẫu)
- [x] Seed dữ liệu mẫu: tạo site mẫu, user, admin, data mẫu cho từng site

## 2. Middleware & Data Isolation
- [x] Viết middleware nhận diện site từ domain (`req.hostname`) → map sang `site_id`
- [x] Viết middleware tự động filter data theo `site_id` cho mọi API (Mongoose plugin hoặc custom middleware)
- [x] Đảm bảo mọi truy vấn đều có điều kiện `site_id` (sử dụng req.siteFilter trong controller)
- [x] Viết test case kiểm tra isolation dữ liệu giữa các site (có thể dùng Jest hoặc script Node.js)

## 3. Authentication & Authorization
- [x] Cập nhật hệ thống xác thực để JWT/session chứa thông tin `site_id`, `role`
- [x] Xây dựng hệ thống role: super_admin, site_admin, user
- [x] Middleware kiểm tra quyền truy cập theo role và `site_id`
- [x] Cho phép super_admin switch giữa các site (qua header x-site-id)

## 4. Routing & Domain Management
- [x] Cấu hình DNS trỏ nhiều domain/subdomain (bao gồm domain riêng của affiliate) về server backend
- [x] Cấu hình reverse proxy (Nginx/Caddy) với wildcard domain hoặc server_name _; để tự động nhận mọi domain mới mà không cần reload khi thêm site
- [x] FE: Gọi API lấy config/theme/logo riêng cho từng site dựa trên domain
- [x] Cho phép super admin thêm/sửa domain hoặc subdomain cho từng site trong admin panel (dashboard), bao gồm domain riêng của affiliate
- [x] Backend nhận diện domain qua req.hostname, map sang site_id đúng trong DB (hỗ trợ nhiều domain cho 1 site)

> **Lưu ý cập nhật:**
> - Hỗ trợ affiliate có domain riêng (không chỉ subdomain), chỉ cần trỏ domain về server và thêm vào dashboard, không cần dev can thiệp nginx.
> - Nginx cấu hình wildcard hoặc server_name _; để nhận mọi domain, không cần reload khi thêm domain mới.
> - Backend map domain sang site_id động, đảm bảo isolation.

## 5. Asset & Theme Management
- [ ] Lưu trữ logo, theme, config riêng cho từng site (mapping theo `site_id`)
- [ ] API trả về config/theme/logo theo domain hoặc `site_id`

## 6. Bảo mật & Audit
- [ ] Đảm bảo mọi API đều validate `site_id`, không cho phép override từ FE
- [ ] Ghi log mọi thao tác admin (user_id, site_id, action, timestamp)
- [ ] Viết test kiểm tra data isolation và phân quyền

## 7. Dashboard & Quản lý tập trung
- [ ] Super Admin Dashboard: tổng quan site, user, doanh thu, quản lý site, analytics
- [ ] Site Admin Dashboard: chỉ xem/điều chỉnh data của site mình, báo cáo riêng

> **Lưu ý:** Sẽ sử dụng admin dashboard hiện có để phát triển và tích hợp các tính năng quản lý multi-tenant, super admin, site admin, analytics, báo cáo, v.v. Không cần xây mới dashboard từ đầu, chỉ cần mở rộng và tối ưu dựa trên nền tảng sẵn có.

## 8. Testing & CI/CD - tạm thời chưa cần lắm
- [ ] Viết test case cho multi-tenant, kiểm tra isolation, phân quyền
- [ ] Backup dữ liệu trước khi migrate
- [ ] Tích hợp CI/CD, tự động test và deploy

## 9. Tài liệu & Hướng dẫn - tạm thời chưa cần lắm
- [ ] Viết tài liệu hướng dẫn cấu hình multi-tenant, domain, seed data
- [ ] Viết tài liệu API cho dev

---

**Ghi chú:**  
- Ưu tiên backup dữ liệu trước khi migrate.
- Có thể thực hiện từng phần, kiểm tra kỹ trước khi triển khai production.
