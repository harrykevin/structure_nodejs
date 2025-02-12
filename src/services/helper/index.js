import crypto from "crypto";
import User from "../../models/User.js";

export const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999); // Generate a random number between 100000 and 999999
  return otp.toString();
};

export const generatePromoCode = () => {
  const prefix = ["XMAS", "BLACKFRI", "NEWYEAR", "SUMMER", "IBLISS"];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
  return `${randomPrefix}${randomNumber}`;
};

export const getUserById = async (id) => {
  try {
    // Fetch total count of arts that are not deleted
    const user = await User.findById(id);

    return user;
  } catch (error) {
    console.error(`fetching orders error:`, error);
    next(error);
  }
}

export const getWeeksInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const weeks = [];
  let startOfWeek, endOfWeek;

  while (date.getMonth() === month) {
    startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (startOfWeek.getMonth() !== month)
      startOfWeek = new Date(year, month, 1);
    if (endOfWeek.getMonth() !== month)
      endOfWeek = new Date(year, month + 1, 0);

    weeks.push({ start: new Date(startOfWeek), end: new Date(endOfWeek) });
    date.setDate(date.getDate() + 7);
  }

  return weeks;
};

export function getCurrentWeek() {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay(); // 0 (Sun) to 6 (Sat)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - dayOfWeek); // Set to Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to Saturday
  return { startOfWeek, endOfWeek };
}
