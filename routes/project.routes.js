const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User"); 
const Invitation = require("../models/Team");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

//new project
router.post("/new", authMiddleware, async (req, res) => {
  try {
      const { name, description, start_date, end_date, priority, status } = req.body;

      // Create the new project (without collaborators initially)
      const newProject = new Project({
          name,
          description,
          start_date,
          end_date,
          priority,
          status,
          admin: req.user.id,
      });

      await newProject.save();
      res.status(201).json({ message: "Project created successfully", project: newProject });
  } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Error creating project", error: error.message });
  }
});


router.get("/all", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ admin: req.user.id });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
});


// Route GET /api/projects/view/:id
router.get("/view/:id", authMiddleware, async (req, res) => {
  try {
    // Validation de l'ID (format ObjectId)
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    // Recherche du projet sans population des collaborateurs
    const project = await Project.findById(req.params.id).exec();

    // Vérification si le projet existe
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Préparation des données à renvoyer (sans les collaborateurs)
    const projectResponse = {
      id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      priority: project.priority,
      tasks: project.tasks || [], // Les tâches sont conservées
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };

    // Réponse avec statut 200
    res.status(200).json(projectResponse);

  } catch (error) {
    console.error("Error fetching project details:", error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    res.status(500).json({
      message: "Error fetching project details",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

  //edit project
  router.put("/edit/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params; // ID du projet à modifier
      const { name, description, start_date, end_date, priority, status} = req.body;
  
      // Vérifier si le projet existe
      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
  
    
      // Mettre à jour les champs du projet
      project.name = name || project.name;
      project.description = description || project.description;
      project.start_date = start_date || project.start_date;
      project.end_date = end_date || project.end_date;
      project.priority = priority || project.priority;
      project.status = status || project.status;

      // Sauvegarder les modifications
      await project.save();
      
      res.status(200).json({ message: "Project updated successfully", project });
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Error updating project", error: error.message });
    }
  });

//delete project
router.delete('/delete/:id', async (req, res) => {
  try {
      const { id } = req.params;
      console.log("Deleting project with ID:", id);

      const project = await Project.findByIdAndDelete(id);
      if (!project) {
          return res.status(404).json({ message: 'Project not found' });
      }

      res.status(200).json({ message: 'Project deleted successfully', project });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

router.patch('/status/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Ongoing', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Update project status
    project.status = status;
    await project.save();

    res.json({ success: true, message: 'Project status updated successfully', project });
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});



module.exports = router;
