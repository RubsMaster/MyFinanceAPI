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

bot.on("callback_query", async (query) => {
    const { data, message } = query;
    const userId = message.chat.id;
  
    // Inicializar el estado si no existe
    if (!userState[userId]) {
      userState[userId] = { step: 1 };
    }
  
    switch (userState[userId].step) {
      case 1:
        if (data === "write") {
          userState[userId].step = 2;
          bot.sendMessage(userId, "¿Qué tipo de movimiento?", movementTypeKeyboard);
        } else if (data === "read") {
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
          userState[userId].movementType = data;
          userState[userId].step = 3;
          bot.sendMessage(
            userId,
            `¿En qué lugar hiciste el ${data === "income" ? "ingreso" : "gasto"}?`
          );
        }
        break;
  
      case 3:
        userState[userId].name = data;
        userState[userId].step = 4;
        bot.sendMessage(
          userId,
          `¿Cuánto fue el monto del ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}?`
        );
        break;
  
      case 4:
        const amount = parseFloat(data);
        if (isNaN(amount)) {
          bot.sendMessage(userId, "Por favor, ingresa un monto válido.");
          return;
        }
        userState[userId].amount = amount;
        userState[userId].step = 5;
        bot.sendMessage(
          userId,
          `¿Tienes alguna descripción adicional para el ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}?`
        );
        break;
  
      case 5:
        userState[userId].description = data;
        userState[userId].step = 6;
  
        try {
          // Llamamos a la función createExpense
          const expense = await createExpense({
            name: userState[userId].name,
            amount: userState[userId].amount,
            description: userState[userId].description || "",
          });
  
          if (expense instanceof Error) {
            bot.sendMessage(userId, "Hubo un error al registrar el movimiento.");
          } else {
            bot.sendMessage(
              userId,
              `El ${userState[userId].movementType === "income" ? "ingreso" : "gasto"} fue registrado exitosamente.`
            );
          }
        } catch (e) {
          console.error(e);
          bot.sendMessage(userId, "Hubo un error al registrar el movimiento.");
        }
        delete userState[userId]; // Reseteamos el estado del usuario
        break;
    }
  });
  

  bot.on("message", (msg) => {
    const userId = msg.chat.id;
  
    if (!userState[userId]) return; // Si el estado no existe, no hacemos nada
  
    // Verificar si el mensaje es válido para el paso actual
    if (userState[userId].step === 3) {
      // Paso 3: Esperando el lugar
      userState[userId].name = msg.text; // Guardamos el nombre del lugar
      userState[userId].step = 4; // Avanzamos al paso 4
      bot.sendMessage(
        userId,
        `¿Cuánto fue el monto del ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}?`
      );
    } else if (userState[userId].step === 4) {
      // Paso 4: Esperando el monto
      const amount = parseFloat(msg.text);
      if (isNaN(amount)) {
        bot.sendMessage(userId, "Por favor, ingresa un monto válido.");
        return;
      }
      userState[userId].amount = amount; // Guardamos el monto
      userState[userId].step = 5; // Avanzamos al paso 5
      bot.sendMessage(
        userId,
        `¿Tienes alguna descripción adicional para el ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}?`
      );
    } else if (userState[userId].step === 5) {
      // Paso 5: Esperando la descripción
      userState[userId].description = msg.text; // Guardamos la descripción
      userState[userId].step = 6; // Avanzamos al último paso
      bot.sendMessage(
        userId,
        `Registrando el ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}...`
      );
    } else {
      // Si el paso no corresponde, ignoramos el mensaje
      bot.sendMessage(userId, "Por favor, sigue el flujo adecuado.");
    }
  });

export default bot;
