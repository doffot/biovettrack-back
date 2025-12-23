// src/controllers/RecipeController.ts
import type { Request, Response } from "express";
import Recipe from "../models/Recipe";
import Patient from "../models/Patient";

export class RecipeController {
  /* ---------- CREAR RECETA ---------- */
  static createRecipe = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const recipeData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      if (!patientId) {
        return res.status(400).json({ msg: "ID de paciente es obligatorio" });
      }

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id,
      });

      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado o no autorizado" });
      }

      // Validar que tenga al menos un medicamento
      if (!recipeData.medications || recipeData.medications.length === 0) {
        return res.status(400).json({ msg: "Debe incluir al menos un medicamento" });
      }

      const recipe = new Recipe({
        ...recipeData,
        patientId,
        veterinarianId: req.user._id,
        issueDate: recipeData.issueDate || new Date(),
      });

      await recipe.save();

      res.status(201).json({
        msg: "Receta creada correctamente",
        recipe,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en createRecipe:", error);
      res.status(500).json({ msg: "Error al crear la receta" });
    }
  };

  /* ---------- OBTENER RECETAS POR PACIENTE ---------- */
  static getRecipesByPatient = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { patientId } = req.params;

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id,
      });

      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado o no autorizado" });
      }

      const recipes = await Recipe.find({ patientId })
        .populate("consultationId", "consultationDate reasonForVisit")
        .sort({ issueDate: -1 });

      res.json({ recipes });
    } catch (error: any) {
      console.error("Error en getRecipesByPatient:", error);
      res.status(500).json({ msg: "Error al obtener recetas" });
    }
  };

  /* ---------- OBTENER TODAS LAS RECETAS DEL VETERINARIO ---------- */
  static getAllRecipes = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const recipes = await Recipe.find({ veterinarianId: req.user._id })
        .populate("patientId", "name species breed")
        .populate("consultationId", "consultationDate reasonForVisit")
        .sort({ issueDate: -1 });

      res.json({ recipes });
    } catch (error: any) {
      console.error("Error en getAllRecipes:", error);
      res.status(500).json({ msg: "Error al obtener recetas" });
    }
  };

  /* ---------- OBTENER RECETA POR ID ---------- */
  static getRecipeById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const recipe = await Recipe.findById(req.params.id)
        .populate("patientId", "name species breed owner")
        .populate("consultationId", "consultationDate reasonForVisit");

      if (!recipe) {
        return res.status(404).json({ msg: "Receta no encontrada" });
      }

      // Verificar que el veterinario sea el dueño de la receta
      if (recipe.veterinarianId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "No tienes permiso para ver esta receta" });
      }

      res.json({ recipe });
    } catch (error: any) {
      console.error("Error en getRecipeById:", error);
      res.status(500).json({ msg: "Error al obtener receta" });
    }
  };

  /* ---------- ACTUALIZAR RECETA ---------- */
  static updateRecipe = async (req: Request, res: Response) => {
    const { id } = req.params;
    const recipeData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const recipe = await Recipe.findById(id);
      if (!recipe) {
        return res.status(404).json({ msg: "Receta no encontrada" });
      }

      // Verificar autorización
      if (recipe.veterinarianId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "No tienes permiso para actualizar esta receta" });
      }

      // Validar medicamentos si se envían
      if (recipeData.medications && recipeData.medications.length === 0) {
        return res.status(400).json({ msg: "Debe incluir al menos un medicamento" });
      }

      const updatedRecipe = await Recipe.findByIdAndUpdate(id, recipeData, {
        new: true,
        runValidators: true,
      })
        .populate("patientId", "name species breed")
        .populate("consultationId", "consultationDate reasonForVisit");

      res.json({
        msg: "Receta actualizada correctamente",
        recipe: updatedRecipe,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en updateRecipe:", error);
      res.status(500).json({ msg: "Error al actualizar receta" });
    }
  };

  /* ---------- ELIMINAR RECETA ---------- */
  static deleteRecipe = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const recipe = await Recipe.findById(req.params.id);
      if (!recipe) {
        return res.status(404).json({ msg: "Receta no encontrada" });
      }

      // Verificar autorización
      if (recipe.veterinarianId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "No tienes permiso para eliminar esta receta" });
      }

      await Recipe.findByIdAndDelete(req.params.id);

      res.json({ msg: "Receta eliminada correctamente" });
    } catch (error: any) {
      console.error("Error en deleteRecipe:", error);
      res.status(500).json({ msg: error.message || "Error al eliminar receta" });
    }
  };
}