import supabase from "../lib/supabase.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  const { email, password, name, role_id } = req.body;

  try {
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password and name are required" });
    }

    // Insert user with optional role_id
    const insertPayload = { email, password, name };
    if (role_id) insertPayload.role_id = role_id;

    const { data, error } = await supabase
      .from("users")
      .insert([insertPayload])
      .select('id, name, email, role_id')
      .single();

    if (error) {
      console.error("Supabase insert user error:", error);
      // PostgreSQL unique violation will appear here, but Supabase error.code may be different.
      // Check error.details or error.message for duplicate email detection.
      if (error.code === "23505" || (error.details && error.details.includes('already exists'))) {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: "Something went wrong, please try again" });
    }

    // Optionally fetch role name
    let roleName = null;
    if (data.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', data.role_id).single();
      roleName = roleData ? roleData.name : null;
    }

    // sign token — consider including user id in token for later uses
    const token = jwt.sign({ id: data.id, email: data.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      data: { ...data, role_name: roleName },
      message: "User signed up successfully",
      token,
    });
  } catch (error) {
    console.error("Signup server error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();
    if (error || !data) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({
      data,
      message: "User logged in successfully",
      token,
    });
  }
  catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
export const createUser = async (req, res) => {
  const { email, password, name, role_id } = req.body;

  try {
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password and name are required" });
    }

    // Hash the password

    // Insert user with optional role_id
    const insertPayload = {
      email,
      password,
      name
    };
    if (role_id) insertPayload.role_id = role_id;

    const { data, error } = await supabase
      .from("users")
      .insert([insertPayload])
      .select('id, name, email, role_id, created_at')
      .single();

    if (error) {
      console.error("Supabase insert user error:", error);

      if (error.code === "23505" || (error.details && error.details.includes('already exists'))) {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: "Something went wrong, please try again" });
    }

    // Optionally fetch role name
    let roleName = null;
    if (data.role_id) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('name')
        .eq('id', data.role_id)
        .single();
      roleName = roleData ? roleData.name : null;
    }

    res.status(201).json({
      data: {
        ...data,
        role_name: roleName
      },
      message: "User created successfully"
    });
  } catch (error) {
    console.error("Create user server error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE USER (Admin)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, name, role_id } = req.body;

  try {
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select('id, email')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare update payload
    const updatePayload = { email, name, password };

    // Add role_id to update (can be null)
    updatePayload.role_id = role_id || null;

    // Hash password if provided


    // Update user
    const { data, error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq('id', id)
      .select('id, name, email, role_id, created_at')
      .single();

    if (error) {
      console.error("Supabase update user error:", error);

      if (error.code === "23505" || (error.details && error.details.includes('already exists'))) {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: "Something went wrong, please try again" });
    }

    // Optionally fetch role name
    let roleName = null;
    if (data.role_id) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('name')
        .eq('id', data.role_id)
        .single();
      roleName = roleData ? roleData.name : null;
    }

    res.status(200).json({
      data: {
        ...data,
        role_name: roleName
      },
      message: "User updated successfully"
    });
  } catch (error) {
    console.error("Update user server error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE USER (Admin)
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select('id, name, email')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user
    const { error } = await supabase
      .from("users")
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Supabase delete user error:", error);
      return res.status(500).json({ error: "Something went wrong, please try again" });
    }

    res.status(200).json({
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user server error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Query users table with admin role
    const { data, error } = await supabase
      .from("users")  // Changed from "admin" to "users"
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("role_id", 1)  // Admin role
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "Invalid email or password" }); // Changed from 200 to 401
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({
      data,
      message: "Admin logged in successfully",
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};




export const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*");
    if (error) {
      return res.status(500).json({ error: "Something went wrong, please try again" });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}


