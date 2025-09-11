//verify jwt token
import jwt from "jsonwebtoken";
export const authVerify = (req, res, next) => {
  const token = req.headers.auth;
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({ error: "Invalid token" });
        }
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};