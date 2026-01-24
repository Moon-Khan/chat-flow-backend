import Story from "./story_model.js";
import User from "../user/user_model.js";
import { sendResponse } from "../../utils/response.js";

// Upload a new story
export const uploadStory = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return sendResponse(res, 400, false, "No media file uploaded");
        }

        const file = req.files[0]; // Single file per story upload usually
        const mediaUrl = `/uploads/${file.filename}`;
        const mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';

        const story = await Story.create({
            user: req.user.id,
            mediaUrl,
            mediaType
        });

        return sendResponse(res, 201, true, "Story uploaded successfully", story);
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// Get stories for feed (filtered by privacy)
export const getStories = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const now = new Date();

        // Fetch all active stories with user details
        // We populate user to check privacy settings
        const stories = await Story.find({ expiresAt: { $gt: now } })
            .sort({ createdAt: -1 })
            .populate("user", "username email avatarUrl storyPrivacy storyAllowedUsers")
            .lean();

        // Filter stories based on privacy
        const visibleStories = stories.filter(story => {
            // 1. Own story always visible
            if (String(story.user._id) === String(currentUserId)) return true;

            // 2. Check author's privacy setting
            const author = story.user;
            if (author.storyPrivacy === 'everyone') return true;
            if (author.storyPrivacy === 'selected') {
                // Check if current user is in allowed list
                return author.storyAllowedUsers.map(id => String(id)).includes(String(currentUserId));
            }
            return false;
        });

        // Group by user for UI
        const groupedStories = visibleStories.reduce((acc, story) => {
            const userId = String(story.user._id);
            if (!acc[userId]) {
                acc[userId] = {
                    user: {
                        _id: story.user._id,
                        username: story.user.username,
                        avatarUrl: story.user.avatarUrl
                    },
                    stories: []
                };
            }
            // Remove sensitive user data from story object before sending
            const { user, ...storyData } = story;
            acc[userId].stories.push(storyData);
            return acc;
        }, {});

        return sendResponse(res, 200, true, "Stories fetched successfully", Object.values(groupedStories));
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// View a story
export const viewStory = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        // Check if already viewed
        const story = await Story.findById(id);
        if (!story) return sendResponse(res, 404, false, "Story not found");

        const alreadyViewed = story.views.some(v => String(v.user) === String(currentUserId));
        if (!alreadyViewed && String(story.user) !== String(currentUserId)) {
            story.views.push({ user: currentUserId });
            await story.save();
        }

        return sendResponse(res, 200, true, "Story viewed");
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};

// Delete a story
export const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        const story = await Story.findOneAndDelete({ _id: id, user: currentUserId });
        if (!story) return sendResponse(res, 404, false, "Story not found or unauthorized");

        return sendResponse(res, 200, true, "Story deleted");
    } catch (err) {
        return sendResponse(res, 500, false, err.message);
    }
};
