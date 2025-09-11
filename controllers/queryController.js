import supabase from "../lib/supabase.js";

export const addQuery = async (req, res) => {
  try {
    const { query_type_id, description, userId, title } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "user id query parameter is required" });
    }

    if (!query_type_id || !description || description.trim().length === 0) {
      return res.status(400).json({ error: "query_type_id and description are required" });
    }

    // fetch user info
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, name, email, role_id")
      .eq("id", userId)
      .single();

    if (userErr || !user) {
      console.error("Error fetching user:", userErr);
      return res.status(400).json({ error: "Invalid user" });
    }

    // get role name
    let userRoleName = null;
    if (user.role_id) {
      const { data: roleData, error: roleErr } = await supabase
        .from("roles")
        .select("name")
        .eq("id", user.role_id)
        .single();
      if (!roleErr && roleData) userRoleName = roleData.name;
    }

    const insertPayload = {
      user_id: userId,
      user_name: user.name || null,
      user_role: userRoleName,
      query_type_id,
      title: title || null,
      description: description.trim(),
    };

    const { data, error } = await supabase
      .from("queries")
      .insert(insertPayload)
      .select(`
        id,
        problem_number,
        title,
        user_id,
        user_name,
        user_role,
        query_type_id,
        description,
        status,
        assigned_specialist_name,
        created_at
      `)
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to create query" });
    }

    return res.status(201).json({ query: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};


// GET /api/roles
export const getRoles = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name, description')
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase roles fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch roles' });
    }

    res.json({ roles: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserQueries = async (req, res) => {
  try {
    const userId = req.query.user_id;
    const status = req.query.status; // optional filter

    if (!userId) {
      return res.status(400).json({ error: "user id query parameter is required" });
    }

    // build query
    let builder = supabase
      .from("queries")
      .select(`
    id,
    problem_number,
    description,
    status,
    created_at,
    updated_at,
    query_types(name),
    creator:users!queries_user_id_fkey(name, email),
    specialist:users!queries_assigned_specialist_id_fkey(name, email)
  `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });



    let { data, error } = await builder;

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "Failed to fetch queries" });
    }
    if (status) {
      data = data.filter(q => q.status === status);
    }

    // Map to a nicer shape if you like:
    const result = data.map((r) => ({
      id: r.id,
      problem_number: r.problem_number,
      description: r.description,
      status: r.status,
      current_assignee_name: r.specialist?.name ?? null,
      query_type: r.query_types?.name ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user_role: r.user_role,
      user_name: r.creator?.name ?? null
    }));

    return res.json({ queries: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
//get query by queryId
export const getQueryById = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { data, error } = await supabase
      .from("queries")
      .select(`
    id,
    problem_number,
    description,
    status,
    created_at,
    updated_at,
    query_types(name),
    creator:users!queries_user_id_fkey(name, email),
    assignedBy:users!queries_assigned_by_fkey(name, email),
    specialist:users!queries_assigned_specialist_id_fkey(name, email)
  `)
      .eq("id", queryId)
      .single();
      


    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "Failed to fetch query" });
    }
    return res.json({ query: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

export const getQueryTypes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("query_types")
      .select("id, name")
      .order("id", { ascending: true });
    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "Failed to fetch query types" });
    }
    return res.status(200).json({ queryTypes: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getAllQueries = async (req, res) => {
  const status = req.query.status;
  const queryType = req.query.queryType; // optional filter
  const userId = req.query.user_id; // optional filter
  if (userId) {
    return getUserQueries(req, res);
  }
  try {
    let builder = supabase
      .from("queries")
      .select(`
    id,
    problem_number,
    description,
    status,
    created_at,
    updated_at,
    query_types(name),
    creator:users!queries_user_id_fkey(name, email),
    assignedBy:users!queries_assigned_by_fkey(name, email),
    specialist:users!queries_assigned_specialist_id_fkey(name, email)
  `)
      .order("created_at", { ascending: false });


    let { data, error } = await builder;
    console.log("data", data);

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "Failed to fetch queries" });
    }
    if (status) {
      data = data.filter(q => q.status === status);
    }
    if (queryType) {
      data = data.filter(q => q.query_types?.name === queryType);
    }

    const result = data.map((r) => ({
      id: r.id,
      problem_number: r.problem_number,
      description: r.description,
      status: r.status,
      current_assignee_name: r.specialist?.name,
      query_type: r.query_types?.name ?? null,
      user: r.creator?.name ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user_role: r.user_role
    }));

    return res.json({ queries: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
export const updateQueryStatus = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { status, assignee_name } = req.body;

    if (!queryId) return res.status(400).json({ error: "Query ID is required" });

    // Validate against schema enum
    const validStatuses = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatePayload = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (assignee_name) {
      updatePayload.assigned_specialist_name = assignee_name;
    }

    const { data, error } = await supabase
      .from("queries")
      .update(updatePayload)
      .eq("id", queryId)
      .select(`
  id,
  problem_number,
  description,
  status,
  assigned_specialist_name,
  updated_at,
  specialist:users!queries_assigned_specialist_id_fkey(name, email)
`)

      .single();


    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).json({ error: "Failed to update query" });
    }

    if (!data) return res.status(404).json({ error: "Query not found" });

    return res.status(200).json({ message: "Query updated successfully", query: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};


export const assignSpecialist = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { specialist_id } = req.body; // ✅ expect id, not just name

    if (!queryId || !specialist_id) {
      return res.status(400).json({ error: "Query ID and specialist id are required" });
    }

    // fetch specialist details
    const { data: specialist, error: specialistErr } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", specialist_id)
      .single();

    if (specialistErr || !specialist) {
      return res.status(400).json({ error: "Invalid specialist" });
    }

    // update query
    const { data, error } = await supabase
      .from("queries")
      .update({
        assigned_specialist_id: specialist.id,          // ✅ set FK
        assigned_specialist_name: specialist.name,      // ✅ optional
        status: "assigned",
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", queryId)
      .select(`
        id,
        problem_number,
        description,
        status,
        assigned_specialist_id,
        assigned_specialist_name,
        updated_at,
        users!queries_assigned_specialist_id_fkey(name, email)
      `)
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).json({ error: "Failed to assign specialist" });
    }

    return res.status(200).json({ message: "Specialist assigned successfully", query: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};



export const getSpecialists = async (req, res) => {
  try {
    const { data: specialists, error } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("role_id", (await supabase.from("roles").select("id").eq("name", "specialist").single()).data.id);

    if (error) {
      console.error("Error fetching specialists:", error);
      return res.status(500).json({ error: "Failed to fetch specialists" });
    }

    return res.status(200).json({ specialists });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};


export const getSpecialistQueries = async (req, res) => {
  try {
    const { specialistName } = req.params;
    const status = req.query.status;

    if (!specialistName) {
      return res.status(400).json({ error: "Specialist name is required" });
    }
    console.log("specialistName", specialistName);

    let builder = supabase
      .from("queries")
      .select(`
    id,
    problem_number,
    description,
    status,
    created_at,
    updated_at,
    query_types(name),
    specialist:users!queries_assigned_specialist_id_fkey(name, email),
    creator:users!queries_user_id_fkey(name, email)
  `)
      .eq("assigned_specialist_name", specialistName)
      .order("created_at", { ascending: false });



    let { data, error } = await builder;

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "Failed to fetch queries" });
    }

    if (status) {
      data = data.filter(q => q.status === status);
    }

    const result = data.map(r => ({
      id: r.id,
      problem_number: r.problem_number,
      description: r.description,
      status: r.status,
      assigned_specialist_name: r.assigned_specialist_name,
      query_type: r.query_types?.name ?? null,
      user: r.users?.name ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return res.json({ queries: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const AddSpecialist = async (req, res) => {
  try {
    const { specialistName } = req.body;
    const { data, error } = await supabase
      .from("specialist_assignments")
      .insert({
        specialist_name: specialistName,
        assigned_at: new Date().toISOString()
      });
    if (error) {
      console.error("Failed to log assignment:", error);
      return res.status(500).json({ error: "Failed to log assignment" });
    }
    return res.status(200).json({ message: "Assignment logged successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}