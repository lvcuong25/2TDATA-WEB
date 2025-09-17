# Reusable Modal Components

## Tổng quan
Bộ modal components có thể tái sử dụng cho tất cả các view trong DatabaseManagement (Calendar, Kanban, Form, etc.).

**Vị trí:** `FE/src/pages/DatabaseManagement/Modals/`

## Components

### 1. CreateRecordModal
Modal tạo record mới với form động.

**Props:**
- `open`: boolean - Hiển thị/ẩn modal
- `onCancel`: function - Callback khi đóng modal
- `tableId`: string - ID của bảng
- `tableColumns`: object - Thông tin các cột của bảng
- `dateField`: string - Tên cột date được chọn (optional)
- `selectedDate`: dayjs - Ngày được chọn từ calendar (optional)
- `onSuccess`: function - Callback khi tạo record thành công

**Tính năng:**
- ✅ Form động dựa trên cấu trúc bảng
- ✅ Hỗ trợ tất cả data types (text, number, date, email, etc.)
- ✅ Rating field với Rate component (giống FormView)
- ✅ Time field với TimePicker (chỉ chọn giờ:phút)
- ✅ Checkbox field với Checkbox component
- ✅ Ẩn các field lookup, linked_table, formula (không cho phép tạo mới)
- ✅ Validation tự động
- ✅ Icon màu sắc đồng bộ với hệ thống (sử dụng dataTypeUtils)
- ✅ Giao diện giống NocoDB

### 2. EditRecordModal
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
- ✅ Checkbox field với Checkbox component
- ✅ Ẩn các field lookup, linked_table, formula (không cho phép chỉnh sửa)
- ✅ Validation tự động
- ✅ Icon màu sắc đồng bộ với hệ thống (sử dụng dataTypeUtils)
- ✅ Giao diện giống NocoDB

## Sử dụng

### Import
```jsx
import { CreateRecordModal, EditRecordModal } from './Modals';
```

### Trong CalendarView
```jsx
<CreateRecordModal
  open={showCreateRecordModal}
  onCancel={() => setShowCreateRecordModal(false)}
  tableId={tableId}
  tableColumns={tableColumns}
  dateField={dateField}
  selectedDate={selectedDateForNewRecord}
  onSuccess={handleCreateRecordSuccess}
/>
```

### Trong KanbanView
```jsx
<CreateRecordModal
  open={showCreateRecordModal}
  onCancel={() => setShowCreateRecordModal(false)}
  tableId={tableId}
  tableColumns={tableColumns}
  onSuccess={handleCreateRecordSuccess}
/>
```

### Trong FormView
```jsx
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
| checkbox | CheckSquareOutlined | #52c41a | Checkbox |
| single_select | DownOutlined | #1890ff | Select |
| multi_select | CheckSquareOutlined | #722ed1 | Select multiple |
| rating | StarOutlined | #faad14 | Rate Component |
| lookup | SearchOutlined | #13c2c2 | Button |
| linked_table | LinkOutlined | #722ed1 | Button |

## Styling
Components sử dụng Ant Design với custom CSS để có giao diện giống NocoDB:
- Modal header với border bottom
- Form fields với border radius và focus states
- Consistent spacing và typography
- Icon màu sắc đồng bộ với dataTypeUtils
