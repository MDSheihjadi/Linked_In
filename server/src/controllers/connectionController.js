import ConnectionRequest from '../models/ConnectionRequest.js';
import User from '../models/User.js';

// POST /api/connections/request/:userId  -> send a request
export const sendRequest = async (req, res, next) => {
  try {
    const toUserId = req.params.userId;
    const fromUserId = req.user._id.toString();

    if (toUserId === fromUserId) {
      return res.status(400).json({ message: "Can't connect with yourself." });
    }

    const targetUser = await User.findById(toUserId);
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    // The unique index on (from, to) in the model is the real
    // guarantee against duplicates — this findOne is just for a
    // friendlier error message instead of a raw 11000 duplicate-key
    // error bubbling up.
    const existing = await ConnectionRequest.findOne({
      from: fromUserId,
      to: toUserId,
      status: 'pending',
    });
    if (existing) {
      return res.status(409).json({ message: 'Request already sent.' });
    }

    const request = await ConnectionRequest.create({
      from: fromUserId,
      to: toUserId,
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Request already sent.' });
    }
    next(err);
  }
};

// PATCH /api/connections/:requestId/accept
export const acceptRequest = async (req, res, next) => {
  try {
    const request = await ConnectionRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    // Only the RECIPIENT can accept — not the sender, not a random user.
    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already resolved.' });
    }

    request.status = 'accepted';
    await request.save();

    // Add each user to the other's confirmed connections list.
    // $addToSet again — prevents duplicate entries if this somehow
    // runs twice.
    await User.findByIdAndUpdate(request.from, {
      $addToSet: { connections: request.to },
    });
    await User.findByIdAndUpdate(request.to, {
      $addToSet: { connections: request.from },
    });

    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Request not found.' });
    next(err);
  }
};

// PATCH /api/connections/:requestId/reject
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

// GET /api/connections/pending -> requests received by the logged-in user
export const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await ConnectionRequest.find({
      to: req.user._id,
      status: 'pending',
    }).populate('from', 'name headline avatarUrl');
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
};
