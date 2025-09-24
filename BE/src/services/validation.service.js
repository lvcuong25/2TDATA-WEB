export const checkExist = async (model, query) => {
  const count = await model.countDocuments(query);
  return count > 0;
};

export const checkExistIfFail = async (model, query, next, errorMessage) => {
  const exists = await checkExist(model, query);
  if (!exists) {
    const error = new Error(errorMessage || "Document does not exist");
    error.status = 400;
    if (next) return next(error);
    throw error;
  }
};
