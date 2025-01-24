import { Router } from "express";
import {createExpense, getAllExpenses, deleteExpenseByID, getProductos, getImages} from "../controllers/expenses.controller.js"

const router = Router();

router.post('/api/createExpense', createExpense)
router.get('/api/getAllExpenses', getAllExpenses)
router.delete('/api/deleteExpense/:id', deleteExpenseByID)
router.get('/api/productos', getProductos)
router.get('/api/getImages', getImages)

export default router;