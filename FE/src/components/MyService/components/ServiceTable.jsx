import { Table, Tag, Space, Button, Tooltip, Pagination } from "antd";
import { SettingOutlined, ClockCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { 
  formatIntervalDisplay, 
  formatNextUpdateTime, 
  updateServiceLinks,
  findAuthorizedLink 
} from "../utils/serviceUtils";

const ServiceTable = ({ 
  services, 
  columns, 
  currentPage, 
  pageSize, 
  total, 
  onPageChange,
  onOpenAutoUpdateModal,
  updatingServiceId 
}) => {
  const handleUpdateLinks = async (record) => {
    await updateServiceLinks(record);
  };

  const getColumns = () => {
    if (columns === 'deployed') {
      return [
        {
          title: "Dịch vụ",
          dataIndex: "service",
          key: "service",
          render: (service) => (
            <div className="flex items-center gap-2">
              <img
                src={service.image && service.image.trim() !== ""
                  ? service.image
                  : "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"}
                alt={service.name}
                className="w-10 h-10 object-cover rounded"
              />
              <div>
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-gray-500">{service.slug}</div>
              </div>
            </div>
          ),
        },
        {
          title: "Thời gian",
          dataIndex: "createdAt",
          key: "createdAt",
          render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
        {
          title: "Kết nối",
          key: "connect",
          width: 120,
          render: (_, record) => {
            const links = record.service?.authorizedLinks || [];
            const hasLink = links.length > 0;
            return (
              <Tooltip title={hasLink ? 'Kết nối dịch vụ' : 'Chưa có link kết nối'}>
                <Button
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    if (hasLink) {
                      // This will be handled by parent component
                    }
                  }}
                  disabled={!hasLink}
                >
                  Kết nối <span style={{ marginLeft: 4 }}>→</span>
                </Button>
              </Tooltip>
            );
          }
        },
      ];
    }

    // Full columns for services with results
    return [
      {
        title: "Dịch vụ",
        dataIndex: "service",
        key: "service",
        render: (service) => (
          <div className="flex items-center gap-2">
            <img
              src={
                service.image && service.image.trim() !== ""
                  ? service.image
                  : "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"
              }
              alt={service.name}
              className="w-10 h-10 object-cover rounded"
            />
            <div>
              <div className="font-medium">{service.name}</div>
              <div className="text-sm text-gray-500">{service.slug}</div>
            </div>
          </div>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag
            color={
              status === "approved"
                ? "green"
                : "green"
            }
          >
            {status === "approved"
              ? "Đã xác nhận"
              : "Đã xác nhận"}
          </Tag>
        ),
      },
      {
        title: "Kết quả",
        dataIndex: "link",
        key: "resultLinks",
        render: (links) => {
          return links && links.length > 0 ? (
            <Space direction="vertical">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Tooltip title={link.description || "Không có mô tả"}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {link.title}
                    </a>
                  </Tooltip>
                </div>
              ))}
            </Space>
          ) : (
            "Chưa có link kết quả"
          );
        },
      },
      {
        title: "Thời gian",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date) => new Date(date).toLocaleDateString("vi-VN"),
      },
      {
        title: "Cập nhật tự động",
        key: "autoUpdate",
        render: (_, record) => (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag color={record.autoUpdate?.enabled ? "green" : "default"}>
                {record.autoUpdate?.enabled ? (() => {
                  console.log('🔍 TABLE DEBUG for service:', record.service?.name);
                  console.log('📊 Raw data:', {
                    interval: record.autoUpdate.interval,
                    scheduleType: record.autoUpdate.scheduleType,
                    scheduleTime: record.autoUpdate.scheduleTime,
                    enabled: record.autoUpdate.enabled
                  });
                  console.log('🔍 Full autoUpdate object:', record.autoUpdate);
                  
                  const displayText = formatIntervalDisplay(
                    record.autoUpdate.interval, 
                    record.autoUpdate.scheduleType, 
                    record.autoUpdate.scheduleTime
                  );
                  
                  console.log('✅ Final display text:', displayText);
                  return displayText;
                })() : "Tắt"}
              </Tag>
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => onOpenAutoUpdateModal(record)}
                title="Cài đặt cập nhật tự động"
              />
            </div>
            {record.autoUpdate?.enabled && (
              <div className="text-xs text-gray-500">
                <ClockCircleOutlined className="mr-1" />
                Tiếp theo: {formatNextUpdateTime(record.autoUpdate.nextUpdateAt)}
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Tiến độ / Thao tác",
        key: "action",
        render: (_, record) => {
          const currentPercent = record.webhookData?.current_percent || record.autoUpdate?.current_percent || 0;
          const isUpdating = updatingServiceId === record._id || record.autoUpdate?.isUpdating;
          const canUpdate = currentPercent >= 100;
          
          return (
            <div className="space-y-2">
              {/* Hiển thị tiến độ */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                  Tiến độ
                  {currentPercent > 0 && currentPercent < 100 && (
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${
                        currentPercent >= 100 ? 'bg-green-500' : 
                        currentPercent >= 75 ? 'bg-blue-500' : 
                        currentPercent >= 50 ? 'bg-yellow-500' : 
                        currentPercent >= 25 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(currentPercent, 100)}%`,
                        transition: 'width 0.5s ease-out'
                      }}
                    ></div>
                    {currentPercent > 0 && currentPercent < 100 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium min-w-[3rem] transition-all duration-300">
                    {currentPercent}%
                  </span>
                </div>
              </div>
              
              {/* Nút cập nhật - chỉ hiện khi đạt 100% */}
              {canUpdate ? (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleUpdateLinks(record)}
                  loading={isUpdating}
                  icon={isUpdating ? <LoadingOutlined /> : null}
                  className="w-full"
                >
                  {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              ) : (
                <div className="text-center">
                  <div className="text-xs text-gray-500">
                    {currentPercent > 0 ? `Chờ đạt 100% để cập nhật` : 'Chưa có dữ liệu'}
                  </div>
                </div>
              )}
            </div>
          );
        },
      },
    ];
  };

  return (
    <Table
      columns={getColumns()}
      dataSource={services}
      rowKey={(record) => record._id}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        pageSizeOptions: ['3', '6', '9', '18'],
        showTotal: (total) => `Tổng số ${total} dịch vụ`,
      }}
      onChange={onPageChange}
    />
  );
};

export default ServiceTable;
