const express = require('express')
const Post = require('../models/Post')
const Comment = require('../models/Comment')
const auth = require('../middleware/auth')
const rateLimit = require('express-rate-limit');

const router = express.Router()

const commentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5 
  })

  router.post('/:postId/comments', auth, commentLimiter, async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId)
      if (!post) {
        return res.status(404).send({ error: 'Post not found' })
      }
      const comment = new Comment({
        text: req.body.text,
        author: req.user._id,
        post: post._id
      });
      await comment.save()
      res.status(201).send(comment)
    } catch (error) {
      res.status(400).send(error)
    }
  }) 


 
  // Reply to an existing comment
router.post('/:postId/comments/:commentId/reply', auth, commentLimiter, async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId)
      if (!post) {
        return res.status(404).send({ error: 'Post not found' });
      }
      const parentComment = await Comment.findById(req.params.commentId)
      if (!parentComment) {
        return res.status(404).send({ error: 'Parent comment not found' })
      }
      const reply = new Comment({
        text: req.body.text,
        author: req.user._id,
        post: post._id,
        parentComment: parentComment._id
      });
      await reply.save()
      res.status(201).send(reply)
    } catch (error) {
      res.status(400).send(error)
    }
  })

// Get comments for a post
router.get('/:postId/comments', async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId)
      if (!post) {
        return res.status(404).send({ error: 'Post not found' })
      }
      const sortBy = req.query.sortBy || 'createdAt'
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1
      const comments = await Comment.find({ post: post._id, parentComment: null })
        .sort({ [sortBy]: sortOrder })
        .populate('author', 'username')
        .lean()
  
      for (let comment of comments) {
        const replies = await Comment.find({ parentComment: comment._id })
          .sort({ createdAt: -1 })
          .limit(2)
          .populate('author', 'username')
          .lean();
        comment.replies = replies
        comment.totalReplies = await Comment.countDocuments({ parentComment: comment._id })
      }
  
      res.send(comments)
    } catch (error) {
      res.status(400).send(error)
    }
  })
  
  // Expand parent-level comments with pagination
  router.get('/:postId/comments/:commentId/expand', async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId)
      if (!post) {
        return res.status(404).send({ error: 'Post not found' })
      }
      const parentComment = await Comment.findById(req.params.commentId)
      if (!parentComment) {
        return res.status(404).send({ error: 'Parent comment not found' })
      }
  
      const page = parseInt(req.query.page) || 1
      const pageSize = parseInt(req.query.pageSize) || 10
  
      const replies = await Comment.find({ parentComment: parentComment._id })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate('author', 'username')
        .lean()
  
      for (let reply of replies) {
        const nestedReplies = await Comment.find({ parentComment: reply._id })
          .sort({ createdAt: -1 })
          .limit(2)
          .populate('author', 'username')
          .lean();
        reply.replies = nestedReplies;
        reply.totalReplies = await Comment.countDocuments({ parentComment: reply._id });
      }
  
      res.send(replies)
    } catch (error) {
      res.status(400).send(error)
    }
  })

  // Create a new post
router.post('/', auth, async (req, res) => {
  try {
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      author: req.user._id
    });
    await post.save();
    res.status(201).send(post);
  } catch (error) {
    res.status(400).send(error);
  }
});
  
  module.exports = router  