import Comment from '../model/Comment.js';
import Record from '../model/Record.js';
import Table from '../model/Table.js';
import User from '../model/User.js';
import { createCommentValidation, updateCommentValidation } from '../validations/commentValidation.js';
// PostgreSQL imports
import { Table as PostgresTable, Record as PostgresRecord } from '../models/postgres/index.js';

// Get all comments for a record
export const getCommentsByRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    // Verify record exists (check both MongoDB and PostgreSQL)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(recordId);
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(recordId);

    let record = null;
    if (isMongoId) {
      record = await Record.findById(recordId);
    } else if (isUuid) {
      record = await PostgresRecord.findByPk(recordId);
    } else {
      // Try both if format is unclear
      const [mongoRecord, postgresRecord] = await Promise.all([
        Record.findById(recordId).catch(() => null),
        PostgresRecord.findByPk(recordId).catch(() => null)
      ]);
      record = mongoRecord || postgresRecord;
    }

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Get comments with author information
    const comments = await Comment.find({ recordId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    // Format comments for frontend
    const formattedComments = comments.map(comment => ({
      _id: comment._id,
      text: comment.text,
      author: comment.author?.name || comment.authorName,
      authorId: comment.author?._id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }));

    res.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { text, tableId } = req.body;
    const userId = req.user?._id || req.user?.id; // Assuming user is attached to request from auth middleware
    
    // console.log('🔍 Create Comment Debug:', { recordId, text, tableId, userId, user: req.user });

    // Validate input
    const { error } = createCommentValidation.validate({ text, tableId });
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details.map(detail => detail.message) 
      });
    }

    // Verify record exists (check both MongoDB and PostgreSQL)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(recordId);
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(recordId);

    let record = null;
    if (isMongoId) {
      record = await Record.findById(recordId);
    } else if (isUuid) {
      record = await PostgresRecord.findByPk(recordId);
    } else {
      // Try both if format is unclear
      const [mongoRecord, postgresRecord] = await Promise.all([
        Record.findById(recordId).catch(() => null),
        PostgresRecord.findByPk(recordId).catch(() => null)
      ]);
      record = mongoRecord || postgresRecord;
    }

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Verify table exists (check both MongoDB and PostgreSQL)
    const isTableMongoId = /^[0-9a-fA-F]{24}$/.test(tableId);
    const isTableUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(tableId);

    let table = null;
    if (isTableMongoId) {
      table = await Table.findById(tableId);
    } else if (isTableUuid) {
      table = await PostgresTable.findByPk(tableId);
    } else {
      // Try both if format is unclear
      const [mongoTable, postgresTable] = await Promise.all([
        Table.findById(tableId).catch(() => null),
        PostgresTable.findByPk(tableId).catch(() => null)
      ]);
      table = mongoTable || postgresTable;
    }

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get user information
    // console.log('🔍 Looking for user with ID:', userId);
    const user = await User.findById(userId);
    // console.log('🔍 User found:', user ? 'YES' : 'NO');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create comment
    // console.log('🔍 Creating comment with data:', { text: text.trim(), recordId, tableId, author: userId, authorName: user.name });
    const comment = new Comment({
      text: text.trim(),
      recordId,
      tableId,
      author: userId,
      authorName: user.name
    });

    // console.log('🔍 Saving comment...');
    await comment.save();
    // console.log('🔍 Comment saved successfully:', comment._id);

    // Populate author information for response
    // console.log('🔍 Populating author information...');
    await comment.populate('author', 'name email');
    // console.log('🔍 Author populated:', comment.author);

    // Format response
    const formattedComment = {
      _id: comment._id,
      text: comment.text,
      author: comment.author?.name || comment.authorName,
      authorId: comment.author?._id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    };

    // console.log('🔍 Sending response:', formattedComment);
    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: formattedComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user?._id || req.user?.id;

    // Validate input
    const { error } = updateCommentValidation.validate({ text });
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details.map(detail => detail.message) 
      });
    }

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    // Update comment
    comment.text = text.trim();
    comment.updatedAt = new Date();
    await comment.save();

    // Populate author information for response
    await comment.populate('author', 'name email');

    // Format response
    const formattedComment = {
      _id: comment._id,
      text: comment.text,
      author: comment.author?.name || comment.authorName,
      authorId: comment.author?._id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    };

    res.json(formattedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?._id || req.user?.id;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    // Delete comment
    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get comment by ID
export const getCommentById = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId)
      .populate('author', 'name email');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Format response
    const formattedComment = {
      _id: comment._id,
      text: comment.text,
      author: comment.author?.name || comment.authorName,
      authorId: comment.author?._id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    };

    res.json(formattedComment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
