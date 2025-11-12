const userService = require('../services/userService');

const requireProfileComplete = async (req, res, next) => {
  try {
    const user = await userService.findById(req.user.sub);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!user.profileComplete) {
      return res.status(403).json({
        message: '프로필 설정이 필요합니다.',
        code: 'PROFILE_INCOMPLETE',
      });
    }
    req.account = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { requireProfileComplete };
