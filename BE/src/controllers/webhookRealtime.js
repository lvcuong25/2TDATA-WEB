import express from 'express';

// Controller cho webhook realtime
export const webhookRealtime = async (req, res) => {
  try {
    // TODO: Xử lý realtime ở đây (emit socket, lưu DB, ...)
    res.status(200).json({ message: 'Webhook realtime received', data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 