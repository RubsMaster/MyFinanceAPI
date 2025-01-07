import Expense from '../models/expense.model.js';

export const createExpense = async (obj) => {
    try {
      if (!obj.name || !obj.amount) {
        console.error('Datos incompletos:', obj);
        throw new Error("Faltan datos importantes");
      }
  
      const expense = new Expense(obj);
      await expense.save();
      console.log('Gasto guardado con éxito:', expense);
      return expense;
    } catch (e) {
      console.error('Error al guardar el gasto:', e);
      return new Error("Error creating expense");
    }
  };
  

export const getAllExpenses = async () => {
    try {
        const expenses = await Expense.find();
        return expenses
    } catch (e) {
        console.error(e);
        return Error("Error retrieving expenses");
    }
}

export const deleteExpenseByID = async (req, res) => {
    try {
        const result = await Expense.findByIdAndDelete(req.params.id)
        res.status(200).send(`Item with id ${req.params.id} deleted succesfully`)
    } catch (error) {
        console.error(error);
        res.status(500).send(`Error trying to delete item with id ${req.params.id}`)
    }
}