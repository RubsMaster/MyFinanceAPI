import TelegramBot from "node-telegram-bot-api";
import { getAllExpenses, createExpense } from "../controllers/expenses.controller.js";

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

const confirmationKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "Confirmar", callback_data: "confirm" }],
      [{ text: "Regresar", callback_data: "back" }],
    ],
  },
};

bot.onText(/\/restart/, (msg) => {
  const userId = msg.chat.id;
  userState[userId] = { step: 1 };
  bot.sendMessage(userId, `Paso actual: ${userState[userId].step}`);
  bot.sendMessage(userId, "¡Hola! ¿Qué te gustaría hacer?", writeReadKeyboard);
});

bot.on("callback_query", async (query) => {
  const { data, message } = query;
  const userId = message.chat.id;

  if (!userState[userId]) {
    userState[userId] = { step: 1 };
  }

  switch (userState[userId].step) {
    case 1:
      if (data === "write") {
        userState[userId].step = 2;
        bot.sendMessage(userId, `Paso actual: ${userState[userId].step}`);
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
        bot.sendMessage(userId, `Paso actual: ${userState[userId].step}`);
        bot.sendMessage(
          userId,
          `¿En qué lugar hiciste el ${data === "income" ? "ingreso" : "gasto"}?`
        );
      }
      break;

    case 6:
      if (data === "confirm") {
        try {
          const expense = await createExpense({
            name: userState[userId].name,
            amount: userState[userId].amount,
            description: userState[userId].description || "",
          });

          if (!expense instanceof Error) {
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
        delete userState[userId];
      } else if (data === "back") {
        // Regresar al paso 5
        userState[userId].step = 5;
        bot.sendMessage(userId, `Paso actual: ${userState[userId].step}`);
        bot.sendMessage(userId, "Por favor ingresa nuevamente la descripción.");
      }
      break;
  }
});

bot.on("message", (msg) => {
  const userId = msg.chat.id;

  if (!userState[userId]) return;

  switch (userState[userId].step) {
    case 3:
      userState[userId].name = msg.text;
      userState[userId].step = 4;
      bot.sendMessage(userId, `Paso actual: ${userState[userId].step}`);
      bot.sendMessage(
        userId,
        `¿Cuánto fue el monto del ${userState[userId].movementType === "income" ? "ingreso" : "gasto"}?`
      );
      break;

    case 4:
      const amount = parseFloat(msg.text);
      if (isNaN(amount)) {
        bot.sendMessage(userId, "Por favor, ingresa un monto válido.");
        return;
      }
      userState[userId].amount = amount;
      userState[userId].step = 5;
      bot.sendMessage(userId, `Paso actual: ${userState[userId].step}`);
      bot.sendMessage(userId, "¿Tienes alguna descripción adicional?");
      break;

    case 5:
      userState[userId].description = msg.text;
      userState[userId].step = 6;
      bot.sendMessage(userId, `Paso actual: ${userState[userId].step}`);
      bot.sendMessage(
        userId,
        `Confirmarás el siguiente movimiento:\n\nTipo: ${
          userState[userId].movementType === "income" ? "Ingreso" : "Gasto"
        }\nLugar: ${userState[userId].name}\nMonto: ${userState[userId].amount}\nDescripción: ${
          userState[userId].description
        }`,
        confirmationKeyboard
      );
      break;
  }
});

export default bot;
