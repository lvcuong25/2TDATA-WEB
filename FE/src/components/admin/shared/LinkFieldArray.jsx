import React from 'react';
import { Form, Input, Button, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';

const LinkFieldArray = ({ title, links, onLinksChange, form, fieldNamePrefix }) => {

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    onLinksChange(newLinks);
  };

  const addLinkField = () => {
    onLinksChange([...links, { url: '', title: '', description: '' }]);
  };

  const removeLinkField = (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    onLinksChange(newLinks);
    
    // Manually reconstruct form values to avoid issues with AntD Form state after removal
    const formValues = {};
    newLinks.forEach((link, idx) => {
      formValues[`${fieldNamePrefix}_url_${idx}`] = link.url;
      formValues[`${fieldNamePrefix}_title_${idx}`] = link.title;
      formValues[`${fieldNamePrefix}_description_${idx}`] = link.description;
    });
    form.setFieldsValue(formValues);
  };

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      {links.map((link, index) => (
        <div key={index} className="flex gap-2 mb-4 items-start">
          <div className="flex-1">
            <Form.Item
              name={`${fieldNamePrefix}_url_${index}`}
              rules={[{ required: true, message: 'Vui lòng nhập URL!' }]}
              className="mb-2"
              initialValue={link.url}
            >
              <Input
                placeholder="Nhập URL dịch vụ"
                value={link.url}
                onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
              />
            </Form.Item>
            <Form.Item
              name={`${fieldNamePrefix}_title_${index}`}
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
              className="flex-1 mb-2"
              initialValue={link.title}
            >
              <Input
                placeholder="Nhập tiêu đề"
                value={link.title}
                onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
              />
            </Form.Item>
            <Form.Item
              name={`${fieldNamePrefix}_description_${index}`}
              className="mb-0"
              initialValue={link.description}
            >
              <Input.TextArea
                placeholder="Nhập mô tả chi tiết"
                value={link.description}
                onChange={(e) => handleLinkChange(index, 'description', e.target.value)}
                rows={2}
              />
            </Form.Item>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            {link.url && link.url.trim() !== '' && (
              <Tag color='blue' style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                <a href={link.url} target="_blank" rel="noopener noreferrer"><LinkOutlined /></a>
              </Tag>
            )}
            {links.length > 0 && (
              <Button
                icon={<DeleteOutlined />}
                onClick={() => removeLinkField(index)}
                danger
              />
            )}
          </div>
        </div>
      ))}
      <Button 
        type="dashed" 
        onClick={addLinkField} 
        icon={<PlusOutlined />}
        className="w-full mt-2"
      >
        Thêm Link
      </Button>
    </div>
  );
};

export default LinkFieldArray;
