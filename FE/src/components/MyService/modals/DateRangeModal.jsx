import { useState } from "react";
import { Modal, DatePicker, Radio } from "antd";
import { CalendarOutlined, AppstoreOutlined, TableOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { connectServiceWithDateRange } from "../utils/serviceUtils";

const DateRangeModal = ({ 
  visible, 
  onClose, 
  selectedService, 
  currentUser 
}) => {
  const [startDate, setStartDate] = useState(null);
  const [storageOption, setStorageOption] = useState('database');
  const [visualizationTool, setVisualizationTool] = useState('metabase');

  const handleConnect = async () => {
    await connectServiceWithDateRange(currentUser, selectedService, startDate, storageOption, visualizationTool);
    onClose();
  };

  const handleCancel = () => {
    setStartDate(null);
    setStorageOption('database');
    setVisualizationTool('metabase');
    onClose();
  };

  const getOkButtonText = () => {
    let text = startDate ? "Kết nối từ ngày đã chọn đến hiện tại" : "Kết nối không có thời gian";
    text += ` - ${storageOption === 'database' ? 'Database' : 'Google Sheet'}`;
    text += ` - ${visualizationTool === 'metabase' ? 'Metabase' : 'Looker Studio'}`;
    return text;
  };

  return (
    <Modal
      title="Cấu hình kết nối dịch vụ"
      open={visible}
      onOk={handleConnect}
      onCancel={handleCancel}
      okButtonProps={{
        style: {
          backgroundColor: '#1890ff',
          borderColor: '#1890ff',
          color: '#fff'
        }
      }}
      okText={getOkButtonText()}
      cancelText="Hủy"
      width={600}
    >
      {selectedService && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <img
                src={
                  selectedService?.service?.image && selectedService.service.image.trim() !== ""
                    ? selectedService.service.image
                    : "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"
                }
                alt={selectedService?.service?.name}
                className="w-8 h-8 object-cover rounded"
              />
              {selectedService.service?.name}
            </h4>
            <p className="text-sm text-gray-600">
              <strong className="text-blue-600">Tùy chọn:</strong> Chọn ngày bắt đầu, thời gian hiện tại sẽ tự động được lấy làm ngày kết thúc
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              <CalendarOutlined className="mr-2" />
              Chọn ngày bắt đầu <span className="text-gray-400">(tùy chọn)</span>
            </label>
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date)}
              style={{ width: '100%' }}
              placeholder="Chọn ngày bắt đầu"
              format="DD/MM/YYYY"
              allowClear
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
            {!startDate && (
              <div className="text-gray-500 text-xs mt-1">
                Để trống nếu không muốn lọc theo thời gian
              </div>
            )}
          </div>

          {startDate && (
            <div className="bg-green-50 p-3 rounded">
              <h5 className="font-medium text-green-700 mb-1">Thông tin đã chọn:</h5>
              <div className="text-sm text-green-600">
                <div>Từ ngày: <strong>{startDate.format('DD/MM/YYYY')}</strong></div>
                <div>Đến ngày: <strong>{dayjs().format('DD/MM/YYYY')}</strong> (hiện tại)</div>
                <div>Tổng số ngày: <strong>{dayjs().diff(startDate, 'days') + 1} ngày</strong></div>
              </div>
            </div>
          )}

          {/* Tùy chọn lưu trữ và visualize - Layout 2 cột */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tùy chọn lưu trữ dữ liệu */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <AppstoreOutlined className="mr-2" />
                Nơi lưu trữ dữ liệu
              </label>
              <Radio.Group
                value={storageOption}
                onChange={(e) => setStorageOption(e.target.value)}
                className="w-full"
              >
                <div className="space-y-2">
                  <Radio value="database" className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">DB</span>
                      </div>
                      <div>
                        <div className="font-medium">Database</div>
                        <div className="text-xs text-gray-500">Lưu trữ trong cơ sở dữ liệu hệ thống</div>
                      </div>
                    </div>
                  </Radio>
                  <Radio value="google_sheet" className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">GS</span>
                      </div>
                      <div>
                        <div className="font-medium">Google Sheet</div>
                        <div className="text-xs text-gray-500">Lưu trữ trong Google Sheets</div>
                      </div>
                    </div>
                  </Radio>
                </div>
              </Radio.Group>
            </div>

            {/* Tùy chọn công cụ visualize */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <TableOutlined className="mr-2" />
                Công cụ visualize
              </label>
              <Radio.Group
                value={visualizationTool}
                onChange={(e) => setVisualizationTool(e.target.value)}
                className="w-full"
              >
                <div className="space-y-2">
                  <Radio value="metabase" className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                        <span className="text-purple-600 text-xs font-bold">MB</span>
                      </div>
                      <div>
                        <div className="font-medium">Metabase</div>
                        <div className="text-xs text-gray-500">Tạo dashboard và báo cáo với Metabase</div>
                      </div>
                    </div>
                  </Radio>
                  <Radio value="looker_studio" className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                        <span className="text-orange-600 text-xs font-bold">LS</span>
                      </div>
                      <div>
                        <div className="font-medium">Looker Studio</div>
                        <div className="text-xs text-gray-500">Tạo báo cáo và dashboard với Looker Studio</div>
                      </div>
                    </div>
                  </Radio>
                </div>
              </Radio.Group>
            </div>
          </div>

          {/* Trạng thái form */}
          <div className="border p-3 rounded bg-green-50 border-green-200">
            <div className="text-xs space-y-1 text-green-700">
              <p className="font-medium">✅ Cấu hình hoàn tất - Sẵn sàng kết nối!</p>
              <p>• Lưu trữ: <strong>{storageOption === 'database' ? 'Database' : 'Google Sheet'}</strong></p>
              <p>• Visualize: <strong>{visualizationTool === 'metabase' ? 'Metabase' : 'Looker Studio'}</strong></p>
              {startDate && <p>• Thời gian: <strong>Từ {startDate.format('DD/MM/YYYY')} đến hiện tại</strong></p>}
              {!startDate && <p>• Thời gian: <strong>Toàn bộ dữ liệu</strong></p>}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <div className="text-xs text-blue-700 space-y-1">
              <p>• <strong>Tùy chọn:</strong> Bạn có thể chọn hoặc không chọn ngày bắt đầu</p>
              <p>• <strong>Nếu chọn:</strong> Dữ liệu sẽ được lọc từ ngày đã chọn đến hiện tại</p>
              <p>• <strong>Nếu không chọn:</strong> Sẽ kết nối dịch vụ với toàn bộ dữ liệu</p>
              <p>• <strong>Tự động:</strong> Thời gian hiện tại sẽ tự động được lấy làm ngày kết thúc</p>
              <p>• <strong>Lưu trữ:</strong> Chọn nơi lưu trữ dữ liệu (Database hoặc Google Sheet)</p>
              <p>• <strong>Visualize:</strong> Chọn công cụ để tạo báo cáo và dashboard</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DateRangeModal;
