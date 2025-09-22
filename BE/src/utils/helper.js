import mongoose from "mongoose";

export const extractQueryListParams = (query) => {
  const page = parseInt(query.page) > 0 ? parseInt(query.page) : 1;
  const limit = parseInt(query.limit) > 0 ? parseInt(query.limit) : 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const toObjectId = (id) => {
  return new mongoose.Types.ObjectId(id);
};

export const toJson = (doc) => {
  try {
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  } catch (error) {
    return null;
  }
};
