import { body } from 'express-validator';

// Validation for creating a view
export const createViewValidation = [
  body('tableId')
    .notEmpty()
    .withMessage('Table ID is required')
    .custom((value) => {
      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

      if (mongoIdRegex.test(value) || uuidRegex.test(value)) {
        return true;
      }
      throw new Error('Invalid table ID format - must be MongoDB ObjectId or UUID');
    }),

  body('name')
    .notEmpty()
    .withMessage('View name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('View name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('View name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('type')
    .notEmpty()
    .withMessage('View type is required')
    .isIn(['grid', 'form', 'gallery', 'kanban', 'calendar'])
    .withMessage('View type must be one of: grid, form, gallery, kanban, calendar'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('config')
    .optional()
    .isObject()
    .withMessage('Config must be an object'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// Validation for updating a view
export const updateViewValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('View name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('View name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('type')
    .optional()
    .isIn(['grid', 'form', 'gallery', 'kanban', 'calendar'])
    .withMessage('View type must be one of: grid, form, gallery, kanban, calendar'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('config')
    .optional()
    .isObject()
    .withMessage('Config must be an object'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// Validation for copying a view
export const copyViewValidation = [
  body('name')
    .notEmpty()
    .withMessage('View name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('View name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('View name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('targetTableId')
    .notEmpty()
    .withMessage('Target table ID is required')
    .custom((value) => {
      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

      if (mongoIdRegex.test(value) || uuidRegex.test(value)) {
        return true;
      }
      throw new Error('Invalid target table ID format - must be MongoDB ObjectId or UUID');
    })
];
