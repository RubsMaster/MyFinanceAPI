import { Router } from "express";
import {createExpense, getAllExpenses} from "../controllers/expenses.controller"

const router = Router();

router.post('/api/createExpense', createExpense)
router.get('/api/getAllExpenses', getAllExpenses)

export default router;