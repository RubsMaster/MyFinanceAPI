import { Router } from "express";
import {createExpense, getAllExpenses, deleteExpenseByID} from "../controllers/expenses.controller"

const router = Router();

router.post('/api/createExpense', createExpense)
router.get('/api/getAllExpenses', getAllExpenses)
router.delete('/api/deleteExpense/:id', deleteExpenseByID)

export default router;