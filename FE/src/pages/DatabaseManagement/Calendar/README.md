# Calendar Components

## Tổng quan
Bộ component Calendar được thiết kế để hiển thị dữ liệu dạng lịch tương tự như NocoDB, với đầy đủ tính năng tạo, xem, chỉnh sửa và quản lý records.

**Vị trí:** `FE/src/pages/DatabaseManagement/Calendar/`

## Tính năng chính

### 1. Tạo Record từ Calendar
- ✅ **Click vào ngày trống** để mở CreateRecordModal
- ✅ **Nút "+" trên ngày trống** để tạo record nhanh
- ✅ **Pre-fill ngày** được chọn vào date field
- ✅ **Hover effects** cho nút "+" với animation

## Components

### 1. CreateRecordModal
Modal tạo record mới với giao diện tương tự NocoDB.

**Props:**
- `open`: boolean - Hiển thị/ẩn modal
- `onCancel`: function - Callback khi đóng modal
- `tableId`: string - ID của bảng
- `tableColumns`: object - Thông tin các cột của bảng
- `dateField`: string - Tên cột date được chọn
- `selectedDate`: dayjs - Ngày được chọn từ calendar
- `onSuccess`: function - Callback khi tạo record thành công

**Tính năng:**
- ✅ Form động dựa trên cấu trúc bảng
- ✅ Hỗ trợ tất cả data types (text, number, date, email, etc.)
- ✅ Rating field với Rate component (giống FormView)
- ✅ Time field với TimePicker (chỉ chọn giờ:phút)
- ✅ Ẩn các field lookup, linked_table, formula (không cho phép tạo mới)
- ✅ Validation tự động
- ✅ Icon màu sắc đồng bộ với hệ thống (sử dụng dataTypeUtils)
- ✅ Giao diện giống NocoDB

### 2. RecordDetailModal
Modal hiển thị chi tiết record.

**Props:**
- `open`: boolean - Hiển thị/ẩn modal
- `onCancel`: function - Callback khi đóng modal
- `record`: object - Dữ liệu record
- `tableColumns`: object - Thông tin các cột của bảng
- `onEdit`: function - Callback khi edit record (optional)
- `onDelete`: function - Callback khi xóa record (optional)

**Tính năng:**
- ✅ Hiển thị tất cả fields với format phù hợp
- ✅ Rating field hiển thị với stars (⭐) và số điểm
- ✅ Time field hiển thị format HH:mm
- ✅ Ẩn các field lookup, linked_table, formula (chỉ hiển thị dữ liệu thô)
- ✅ Icon màu sắc đồng bộ với hệ thống (sử dụng dataTypeUtils)
- ✅ Format dữ liệu theo data type
- ✅ Hiển thị metadata (ID, ngày tạo)
- ✅ Nút Edit để chuyển sang chế độ chỉnh sửa

### 3. EditRecordModal
Modal chỉnh sửa record hiện có.

**Props:**
- `open`: boolean - Hiển thị/ẩn modal
- `onCancel`: function - Callback khi đóng modal
- `record`: object - Dữ liệu record cần chỉnh sửa
- `tableId`: string - ID của bảng
- `tableColumns`: object - Thông tin các cột của bảng
- `onSuccess`: function - Callback khi cập nhật record thành công

**Tính năng:**
- ✅ Form động dựa trên cấu trúc bảng
- ✅ Pre-fill dữ liệu hiện có của record
- ✅ Hỗ trợ tất cả data types (text, number, date, email, etc.)
- ✅ Rating field với Rate component (giống FormView)
- ✅ Time field với TimePicker (chỉ chọn giờ:phút)
- ✅ Ẩn các field lookup, linked_table, formula (không cho phép chỉnh sửa)
- ✅ Validation tự động
- ✅ Icon màu sắc đồng bộ với hệ thống (sử dụng dataTypeUtils)
- ✅ Giao diện giống NocoDB

## Sử dụng

### Trong CalendarView
```jsx
import CreateRecordModal from '../../components/Calendar/CreateRecordModal';
import RecordDetailModal from '../../components/Calendar/RecordDetailModal';
import EditRecordModal from '../../components/Calendar/EditRecordModal';

// Tạo record mới
<CreateRecordModal
  open={showCreateRecordModal}
  onCancel={() => setShowCreateRecordModal(false)}
  tableId={tableId}
  tableColumns={tableColumns}
  dateField={dateField}
  selectedDate={selectedDateForNewRecord}
  onSuccess={handleCreateRecordSuccess}
/>

// Xem chi tiết record
<RecordDetailModal
  open={showRecordModal}
  onCancel={() => setShowRecordModal(false)}
  record={selectedRecord}
  tableColumns={tableColumns}
  onEdit={handleEditRecord}
/>

// Chỉnh sửa record
<EditRecordModal
  open={showEditRecordModal}
  onCancel={() => setShowEditRecordModal(false)}
  record={recordToEdit}
  tableId={tableId}
  tableColumns={tableColumns}
  onSuccess={handleEditRecordSuccess}
/>
```

## Data Types được hỗ trợ

| Data Type | Icon | Màu sắc | Input Type |
|-----------|------|---------|------------|
| text | FontSizeOutlined | #1890ff | Input |
| long_text | FontSizeOutlined | #1890ff | TextArea |
| number | NumberOutlined | #52c41a | InputNumber |
| date | CalendarOutlined | #fa8c16 | DatePicker |
| datetime | CalendarOutlined | #fa8c16 | DatePicker + Time |
| time | FieldTimeOutlined | #fa8c16 | TimePicker |
| email | MailOutlined | #1890ff | Input email |
| url | LinkOutlined | #1890ff | Input url |
| phone | PhoneOutlined | #13c2c2 | Input |
| checkbox | CheckSquareOutlined | #52c41a | Switch |
| single_select | DownOutlined | #1890ff | Select |
| multi_select | CheckSquareOutlined | #722ed1 | Select multiple |
| rating | StarOutlined | #faad14 | Rate Component |
| lookup | SearchOutlined | #13c2c2 | Button |
| linked_table | LinkOutlined | #722ed1 | Button |

## Styling
Components sử dụng Ant Design với custom CSS để có giao diện giống NocoDB:
- Modal header với border bottom
- Form fields với border radius và focus states
- Icon màu sắc cho từng data type
- Button styling tương tự NocoDB

## Dependencies
- React
- Ant Design
- dayjs
- @tanstack/react-query
- axios
