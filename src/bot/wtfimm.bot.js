import TelegramBot from "node-telegram-bot-api";
import { getAllExpenses } from "../controllers/expenses.controller";

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

const userState = {};

const writeReadKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "Registrar Gasto/Ingreso", callback_data: "write" }],
      [{ text: "Revisar mi actividad", callback_data: "read" }],
    ],
  },
};

const movementTypeKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Ingreso", callback_data: "income" }],
        [{ text: "Gasto", callback_data: "expense" }],
      ],
    },
  };

bot.onText(/\/restart/, (msg) => {
  const userId = msg.chat.id;

    userState[userId] = { step: 1 };

    bot.sendMessage(userId, "¡Hola! ¿Qué te gustaría hacer?", writeReadKeyboard);
});

bot.on('callback_query', async (query) => {
    const { data, message } = query;
    const userId = message.chat.id;
    
    // Inicializar el estado si no existe
    if (!userState[userId]) {
      userState[userId] = { step: 1 };  // Paso 1: El usuario ha recibido la opción inicial
    }
  
    switch (userState[userId].step) {
      case 1:
        // El primer paso es cuando el usuario selecciona 'write' o 'read'
        if (data === "write") {
          userState[userId].step = 2; // Avanzamos al siguiente paso: seleccionar tipo de movimiento
          bot.sendMessage(userId, "¿Qué tipo de movimiento?", movementTypeKeyboard);
        } else if (data === "read") {
          // Mostrar los gastos registrados
          try {
            const expenses = await getAllExpenses();
            if (expenses.length === 0) {
              bot.sendMessage(userId, "No tienes gastos registrados.");
            } else {
              const expenseList = expenses
                .map((e) => `• ${e.name}: $${e.amount}`)
                .join("\n");
              bot.sendMessage(userId, `Aquí están tus gastos:\n\n${expenseList}`);
            }
          } catch (error) {
            console.error(error);
            bot.sendMessage(userId, "Hubo un error al obtener los gastos.");
          }
        }
        break;
  
      case 2:
        if (data === "income" || data === "expense") {
          userState[userId].movementType = data; // Guardamos el tipo de movimiento seleccionado
          userState[userId].step = 3; // Avanzamos al siguiente paso: pedir el nombre
          bot.sendMessage(userId, `¿En qué lugar hiciste el ${data === "income" ? "ingreso" : "gasto"}?`);
        }
        break;
  
      case 3:
        // Ahora pedimos el nombre del gasto o ingreso
        userState[userId].name = data;  // Guardamos el nombre del lugar (o lo que haya escrito el usuario)
        userState[userId].step = 4; // Avanzamos al siguiente paso: pedir el monto
        bot.sendMessage(userId, `¿Cuánto fue el monto del ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}?`);
        break;
  
      case 4:
        // Ahora pedimos el monto
        const amount = parseFloat(data);
        if (isNaN(amount)) {
          bot.sendMessage(userId, "Por favor, ingresa un monto válido.");
          return;
        }
        userState[userId].amount = amount; // Guardamos el monto
        userState[userId].step = 5; // Avanzamos al siguiente paso: pedir la descripción
        bot.sendMessage(userId, `¿Tienes alguna descripción adicional para el ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}?`);
        break;
  
      case 5:
        // Pedimos la descripción (opcional)
        userState[userId].description = data;  // Guardamos la descripción
        userState[userId].step = 6; // Avanzamos al último paso: guardar en la base de datos
  
        // Guardamos el gasto o ingreso en la base de datos
        try {
          const expense = new Expense({
            name: userState[userId].name,
            amount: userState[userId].amount,
            description: userState[userId].description || "",
          });
          await expense.save(); // Guardamos en la base de datos
          bot.sendMessage(userId, `El ${userState[userId].movementType === "income" ? "ingreso" : "gasto"} fue registrado exitosamente.`);
        } catch (e) {
          console.error(e);
          bot.sendMessage(userId, "Hubo un error al registrar el movimiento.");
        }
        // Reseteamos el estado del usuario
        delete userState[userId];
        break;  
    }
  });

  bot.on('message', (msg) => {
    const userId = msg.chat.id;
  
    // Si el usuario está en el paso 3, significa que está esperando la respuesta del nombre del lugar
    if (userState[userId] && userState[userId].step === 3) {
      userState[userId].name = msg.text; // Guardamos el nombre del lugar
      userState[userId].step = 4; // Avanzamos al paso 4
      bot.sendMessage(userId, `¿Cuánto fue el monto del ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}?`);
    }
  
    // Si el usuario está en el paso 4, significa que está esperando el monto
    if (userState[userId] && userState[userId].step === 4) {
      const amount = parseFloat(msg.text);
      if (isNaN(amount)) {
        bot.sendMessage(userId, "Por favor, ingresa un monto válido.");
        return;
      }
      userState[userId].amount = amount; // Guardamos el monto
      userState[userId].step = 5; // Avanzamos al paso 5
      bot.sendMessage(userId, `¿Tienes alguna descripción adicional para el ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}?`);
    }
  
    // Si el usuario está en el paso 5, significa que está esperando la descripción
    if (userState[userId] && userState[userId].step === 5) {
      userState[userId].description = msg.text;  // Guardamos la descripción
      userState[userId].step = 6; // Avanzamos al último paso
      bot.sendMessage(userId, `Registrando el ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}...`);
    }
  });
export default bot;
