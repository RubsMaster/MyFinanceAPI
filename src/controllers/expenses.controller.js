import Expense from '../models/expense.model';

export const createExpense = async (req, res) => {
    try{
        const expense = new Expense({
            name: req.body.name,
            amount: req.body.amount
        })
        await expense.save(); // Utilizamos el método `save` en lugar de `create`
        console.log(expense)
        res.status(201).send("Expense created successfully");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error creating expense");
    }   
};

export const getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.status(200).json(expenses);
    } catch (e) {
        console.error(e);
        res.status(500).send("Error retrieving expenses");
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