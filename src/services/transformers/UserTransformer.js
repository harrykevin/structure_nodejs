export const UserTransformer = (user) => {
  return {
    id: user._id,
    fullname: user.fullname,
    email: user.email,
    image: user.image,
    dob: user.dob,
    phone: user.phone,
    gender: user.gender,
    address: user.address,
    zip: user.zip,
    city: user.city,
    state: user.state,
    country: user.country,
    userType: user.userType,
    otp: user.otp,
    isOnline: user.isOnline,
    is_verified: user.is_verified,
    notification_on: user.notification_on,
    is_artist: user.is_artist,
    is_affiliate: user.is_affiliate,
    createdAt: user.createdAt,
    token: user.token,
  };
};

export default UserTransformer;