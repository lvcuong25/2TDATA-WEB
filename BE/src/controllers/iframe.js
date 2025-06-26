import Iframe from '../model/Iframe.js';

// Lấy danh sách tất cả iframe với pagination
export const getAllIframes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const options = {
      page,
      limit,
      sort: { createdAt: -1 }
    };
    
    const result = await Iframe.paginate({}, options);
    
    res.status(200).json({
      docs: result.docs,
      totalDocs: result.totalDocs,
      limit: result.limit,
      page: result.page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      nextPage: result.nextPage,
      prevPage: result.prevPage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy 1 iframe theo id
export const getIframeById = async (req, res) => {
  try {
    const iframe = await Iframe.findById(req.params.id);
    if (!iframe) return res.status(404).json({ message: 'Iframe not found' });
    res.status(200).json(iframe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy iframe theo domain
export const getIframeByDomain = async (req, res) => {
  try {
    const iframe = await Iframe.findOne({ domain: req.params.domain });
    if (!iframe) return res.status(404).json({ message: 'Iframe not found' });
    res.status(200).json(iframe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thêm mới iframe
export const createIframe = async (req, res) => {
  try {
    const { title, url, description, domain } = req.body;
    const newIframe = new Iframe({ title, url, description, domain });
    await newIframe.save();
    res.status(201).json(newIframe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Sửa iframe
export const updateIframe = async (req, res) => {
  try {
    const { title, url, description, domain } = req.body;
    const updatedIframe = await Iframe.findByIdAndUpdate(
      req.params.id,
      { title, url, description, domain },
      { new: true }
    );
    if (!updatedIframe) return res.status(404).json({ message: 'Iframe not found' });
    res.status(200).json(updatedIframe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa iframe
export const deleteIframe = async (req, res) => {
  try {
    const deletedIframe = await Iframe.findByIdAndDelete(req.params.id);
    if (!deletedIframe) return res.status(404).json({ message: 'Iframe not found' });
    res.status(200).json({ message: 'Iframe deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
