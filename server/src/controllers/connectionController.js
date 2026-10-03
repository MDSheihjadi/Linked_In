import ConnectionRequest from '../models/ConnectionRequest.js';
import User from '../models/User.js';

export const sendRequest = async (req, res, next) => {
  try {
    const toUserId = req.params.userId;
    const fromUserId = req.user._id.toString();

    if (toUserId === fromUserId) {
      return res.status(400).json({ message: "Can't connect with yourself." });
    }

    const targetUser = await User.findById(toUserId);
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    const existing = await ConnectionRequest.findOne({ from: fromUserId, to: toUserId });

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ message: 'Request already sent.' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ message: 'You are already connected.' });
      }
      existing.status = 'pending';
      await existing.save();
      return res.status(201).json(existing);
    }

    const reverse = await ConnectionRequest.findOne({ from: toUserId, to: fromUserId, status: 'pending' });
    if (reverse) {
      return res.status(409).json({
        message: 'This person already sent you a request — check your Connections page.',
      });
    }

    const request = await ConnectionRequest.create({ from: fromUserId, to: toUserId });
    res.status(201).json(request);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A request already exists between you two.' });
    }
    next(err);
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    const request = await ConnectionRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already resolved.' });
    }

    request.status = 'accepted';
    await request.save();

    await User.findByIdAndUpdate(request.from, { $addToSet: { connections: request.to } });
    await User.findByIdAndUpdate(request.to, { $addToSet: { connections: request.from } });

    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Request not found.' });
    next(err);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const request = await ConnectionRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already resolved.' });
    }

    request.status = 'rejected';
    await request.save();
    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Request not found.' });
    next(err);
  }
};

export const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await ConnectionRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name headline avatarUrl');
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
};
