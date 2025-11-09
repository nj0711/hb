// backend/src/controllers/userController.js
import User from "../models/User.js";

// ✅ Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Update own profile
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user._id.toString() !== id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to update this profile" });
    }

    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    };

    // update password only if provided
    if (req.body.password && req.body.password.trim() !== "") {
      updateData.password = req.body.password;
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
};


// ✅ Update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ message: "Error updating user status" });
  }
};

// ✅ Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Error deleting user" });
  }
};

// Self reactivation endpoint
export const reactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status === "active") {
      return res.status(400).json({ message: "Account already active" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Suspended accounts require admin review" });
    }

    // if inactive -> reactivate
    user.status = "active";
    await user.save();

    res.json({ message: "Account reactivated successfully", user });
  } catch (err) {
    console.error("Error reactivating user:", err);
    res.status(500).json({ message: "Error reactivating account" });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id name email");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Error fetching admins" });
  }
};

export const getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id; // Get ID from the URL parameter

        // Fetch the user, explicitly selecting only the public fields needed for chat header
        const user = await User.findById(userId).select('name role avatarUrl'); 

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the user object (e.g., { _id, name, role })
        return res.json(user); 
    } catch (error) {
        // Handle common errors like invalid MongoDB ID format (CastError)
        console.error("getUserDetails error:", error);
        res.status(500).json({ message: "Failed to fetch user details." });
    }
};