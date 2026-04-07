const BabyProfile = require('../models/BabyProfile');

exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.query;
    let profile = await BabyProfile.findOne({ userId });
    if (!profile) {
      profile = new BabyProfile({ userId, monthAge: 6 });
      await profile.save();
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { userId, monthAge, allergies, preferences } = req.body;
    let profile = await BabyProfile.findOne({ userId });
    if (!profile) profile = new BabyProfile({ userId });
    if (monthAge !== undefined) profile.monthAge = monthAge;
    if (allergies) profile.allergies = allergies;
    if (preferences) profile.preferences = preferences;
    profile.updatedAt = new Date();
    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};