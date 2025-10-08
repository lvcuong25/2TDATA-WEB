import { useState } from "react";
import { Modal, Switch, Select, TimePicker, DatePicker, Tag, message } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import instance from "../../../utils/axiosInstance-cookie-only";
import { formatIntervalDisplay, formatNextUpdateTime, calculateNextUpdateTime } from "../utils/serviceUtils";

const AutoUpdateModal = ({ 
  visible, 
  onClose, 
  selectedService, 
  onSaveSuccess 
}) => {
  const [autoUpdateSettings, setAutoUpdateSettings] = useState({
    enabled: false,
    scheduleType: 'daily',
    scheduleTime: null,
    scheduleDate: null,
    scheduleDays: [],
  });

  const handleSave = async () => {
    if (!selectedService) return;

    try {
      let requestData = {
        enabled: autoUpdateSettings.enabled
      };

      if (autoUpdateSettings.enabled) {
        if (!autoUpdateSettings.scheduleTime) {
          message.error('Vui lòng chọn thời gian cập nhật');
          return;
        }

        requestData.scheduleType = autoUpdateSettings.scheduleType;
        requestData.scheduleTime = autoUpdateSettings.scheduleTime.format('HH:mm');
        
        if (autoUpdateSettings.scheduleType === 'once' && !autoUpdateSettings.scheduleDate) {
          message.error('Vui lòng chọn ngày cập nhật');
          return;
        }
        
        if (autoUpdateSettings.scheduleType === 'once') {
          requestData.scheduleDate = autoUpdateSettings.scheduleDate.format('YYYY-MM-DD');
        }
        
        if (autoUpdateSettings.scheduleType === 'weekly' && autoUpdateSettings.scheduleDays.length === 0) {
          message.error('Vui lòng chọn ít nhất một ngày trong tuần');
          return;
        }
        
        if (autoUpdateSettings.scheduleType === 'weekly') {
          requestData.scheduleDays = autoUpdateSettings.scheduleDays;
        }

        requestData.nextUpdateAt = calculateNextUpdateTime(autoUpdateSettings);
        requestData.clearInterval = true;
        requestData.interval = null;
      } else {
        requestData.clearSchedule = true;
        requestData.clearInterval = true;
        requestData.scheduleType = null;
        requestData.scheduleTime = null;
        requestData.scheduleDate = null;
        requestData.scheduleDays = null;
        requestData.interval = null;
      }

      console.log('🚀 SENDING REQUEST:', requestData);
      const response = await instance.put(`/requests/${selectedService._id}/auto-update`, requestData);
      console.log('📥 RESPONSE:', response.data);

      message.success(response.data.message);
      onClose();
      onSaveSuccess();
      
    } catch (error) {
      console.error('Error saving auto update settings:', error);
      message.error('Có lỗi xảy ra khi lưu cài đặt');
    }
  };

  const handleOpen = () => {
    if (selectedService) {
      setAutoUpdateSettings({
        enabled: selectedService.autoUpdate?.enabled || false,
        scheduleType: selectedService.autoUpdate?.scheduleType || 'daily',
        scheduleTime: selectedService.autoUpdate?.scheduleTime ? dayjs(`2000-01-01 ${selectedService.autoUpdate.scheduleTime}`) : null,
        scheduleDate: selectedService.autoUpdate?.scheduleDate ? dayjs(selectedService.autoUpdate.scheduleDate) : null,
        scheduleDays: selectedService.autoUpdate?.scheduleDays || []
      });
    }
  };

  return (
    <Modal
      title="Cài đặt cập nhật tự động"
      open={visible}
      onOk={handleSave}
      onCancel={onClose}
      afterOpenChange={handleOpen}
      okText="Lưu"
      cancelText="Hủy"
      width={500}
    >
      {selectedService && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Dịch vụ: {selectedService.service?.name}</h4>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Bật cập nhật tự động
            </label>
            <Switch
              checked={autoUpdateSettings.enabled}
              onChange={(checked) => setAutoUpdateSettings(prev => ({ ...prev, enabled: checked }))}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
            />
          </div>

          {autoUpdateSettings.enabled && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Cài đặt lịch trình cập nhật
              </label>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Loại lịch trình
                  </label>
                  <Select
                    value={autoUpdateSettings.scheduleType}
                    onChange={(value) => setAutoUpdateSettings(prev => ({ ...prev, scheduleType: value }))}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'daily', label: 'Hàng ngày' },
                      { value: 'weekly', label: 'Hàng tuần' },
                      { value: 'monthly', label: 'Hàng tháng' },
                      { value: 'once', label: 'Một lần duy nhất' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Thời gian cập nhật
                  </label>
                  <TimePicker
                    value={autoUpdateSettings.scheduleTime}
                    onChange={(time) => setAutoUpdateSettings(prev => ({ ...prev, scheduleTime: time }))}
                    format="HH:mm"
                    style={{ width: '100%' }}
                    placeholder="Chọn thời gian"
                  />
                </div>

                {autoUpdateSettings.scheduleType === 'once' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ngày cập nhật
                    </label>
                    <DatePicker
                      value={autoUpdateSettings.scheduleDate}
                      onChange={(date) => setAutoUpdateSettings(prev => ({ ...prev, scheduleDate: date }))}
                      style={{ width: '100%' }}
                      placeholder="Chọn ngày"
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
                  </div>
                )}

                {autoUpdateSettings.scheduleType === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Chọn ngày trong tuần
                    </label>
                    <Select
                      mode="multiple"
                      value={autoUpdateSettings.scheduleDays}
                      onChange={(values) => setAutoUpdateSettings(prev => ({ ...prev, scheduleDays: values }))}
                      style={{ width: '100%' }}
                      placeholder="Chọn các ngày"
                      options={[
                        { value: 1, label: 'Thứ 2' },
                        { value: 2, label: 'Thứ 3' },
                        { value: 3, label: 'Thứ 4' },
                        { value: 4, label: 'Thứ 5' },
                        { value: 5, label: 'Thứ 6' },
                        { value: 6, label: 'Thứ 7' },
                        { value: 0, label: 'Chủ nhật' }
                      ]}
                    />
                  </div>
                )}

                {autoUpdateSettings.scheduleTime && (
                  <div className="mt-2 text-sm text-gray-500">
                    Lịch trình: {formatIntervalDisplay(
                      null, 
                      autoUpdateSettings.scheduleType, 
                      autoUpdateSettings.scheduleTime.format('HH:mm')
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {autoUpdateSettings.enabled && (
            <div className="bg-gray-50 p-3 rounded">
              <h5 className="font-medium mb-2">Thông tin hiện tại:</h5>
              <div className="text-sm space-y-1">
                <div>Trạng thái: <Tag color="green">Đang bật</Tag></div>
                <div>
                  Loại: <Tag color="blue">Lịch trình cố định</Tag><br/>
                  Lịch trình: {formatIntervalDisplay(
                    null,
                    autoUpdateSettings.scheduleType,
                    autoUpdateSettings.scheduleTime ? autoUpdateSettings.scheduleTime.format('HH:mm') : null
                  )}
                </div>
                {selectedService.autoUpdate?.lastUpdateAt && (
                  <div>Cập nhật cuối: {new Date(selectedService.autoUpdate.lastUpdateAt).toLocaleString('vi-VN')}</div>
                )}
                {selectedService.autoUpdate?.nextUpdateAt && (
                  <div>Cập nhật tiếp theo: {formatNextUpdateTime(selectedService.autoUpdate.nextUpdateAt)}</div>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>• Hệ thống sẽ tự động gọi các link cập nhật theo lịch trình đã chọn</p>
            <p>• Chỉ áp dụng cho các dịch vụ có link cập nhật</p>
            <p>• <strong>Lịch trình cố định:</strong> Cập nhật vào thời gian cụ thể mỗi ngày/tuần/tháng</p>
            <p>• <strong>Hàng ngày:</strong> Cập nhật vào thời gian đã chọn mỗi ngày</p>
            <p>• <strong>Hàng tuần:</strong> Cập nhật vào thời gian đã chọn vào các ngày được chọn trong tuần</p>
            <p>• <strong>Một lần:</strong> Cập nhật một lần duy nhất vào ngày và thời gian đã chọn</p>
            <p>• Bạn có thể tắt bất kỳ lúc nào</p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AutoUpdateModal;
