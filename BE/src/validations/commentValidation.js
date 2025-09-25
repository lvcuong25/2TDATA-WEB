import Joi from 'joi';

// Validation for creating a comment
export const createCommentValidation = Joi.object({
  text: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Comment text cannot be empty',
      'string.min': 'Comment text must be at least 1 character long',
      'string.max': 'Comment text cannot exceed 1000 characters',
      'any.required': 'Comment text is required'
    }),
  tableId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid table ID format',
      'any.required': 'Table ID is required'
    })
});

// Validation for updating a comment
export const updateCommentValidation = Joi.object({
  text: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Comment text cannot be empty',
      'string.min': 'Comment text must be at least 1 character long',
      'string.max': 'Comment text cannot exceed 1000 characters',
      'any.required': 'Comment text is required'
    })
});

// Validation for comment ID parameter
export const commentIdValidation = Joi.object({
  commentId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid comment ID format',
      'any.required': 'Comment ID is required'
    })
});

// Validation for record ID parameter
export const recordIdValidation = Joi.object({
  recordId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid record ID format',
      'any.required': 'Record ID is required'
    })
});
