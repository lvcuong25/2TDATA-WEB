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
    const [mongoRecord, postgresRecord] = await Promise.all([
      Record.findById(recordId),
      PostgresRecord.findByPk(recordId)
    ]);

    const record = mongoRecord || postgresRecord;
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
    const userId = req.user?.id; // Assuming user is attached to request from auth middleware

    // Validate input
    const { error } = createCommentValidation.validate({ text, tableId });
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details.map(detail => detail.message) 
      });
    }

    // Verify record exists (check both MongoDB and PostgreSQL)
    const [mongoRecord, postgresRecord] = await Promise.all([
      Record.findById(recordId),
      PostgresRecord.findByPk(recordId)
    ]);

    const record = mongoRecord || postgresRecord;
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Verify table exists (check both MongoDB and PostgreSQL)
    const [mongoTable, postgresTable] = await Promise.all([
      Table.findById(tableId),
      PostgresTable.findByPk(tableId)
    ]);

    const table = mongoTable || postgresTable;
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create comment
    const comment = new Comment({
      text: text.trim(),
      recordId,
      tableId,
      author: userId,
      authorName: user.name
    });

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

    res.status(201).json(formattedComment);
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
    const userId = req.user?.id;

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
    if (comment.author.toString() !== userId) {
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
    const userId = req.user?.id;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId) {
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
