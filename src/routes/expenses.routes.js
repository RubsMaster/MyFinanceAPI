import { Router } from "express";
import {getProductos, getImages, getCategories, getSubcategories, getBrands} from "../controllers/expenses.controller.js"

const router = Router();

router.get('/api/productos', getProductos)
router.get('/api/imagenes', getImages)
router.get('/api/categorias', getCategories)
router.get('/api/subcategorias', getSubcategories)
router.get('/api/marcas', getBrands)

export default router;