import express from 'express';
import UserService from '../model/UserService.js';

// Controller cho webhook realtime
export const webhookRealtime = async (req, res, next) => {
  try {
    const webhookArray = req.body;
    if (!Array.isArray(webhookArray)) {
      return res.status(400).json({ message: 'Payload phải là mảng webhook' });
    }
    const results = [];
    for (const item of webhookArray) {
      const payload = item.data;
      if (!payload) continue;
      if (payload.type !== 'update-service') continue; // Chỉ update nếu đúng type
      const userServiceId = payload.service_id; // _id của UserService
      const newLinks = payload.data?.link || [];
      const newLinkUpdates = payload.data?.link_update || [];
      // Tìm UserService theo _id và cập nhật
      const updated = await UserService.findByIdAndUpdate(
        userServiceId,
        { link: newLinks, link_update: newLinkUpdates },
        { new: true }
      );
      if (updated) {
        results.push({ success: true, id: userServiceId });
      } else {
        results.push({ success: false, id: userServiceId, message: 'Không tìm thấy UserService' });
      }
    }
    return res.json({ message: 'Webhook realtime processed', results });
  } catch (error) {
    next(error);
  }
}; 