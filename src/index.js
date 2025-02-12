import app from "./app";
import { connectDB } from "./config/db";
import bot from './bot/wtfimm.bot'


app.listen(process.env.PORT, ()=> {
    connectDB();
    console.log(`listening on port ${process.env.PORT}`);
    console.log("Bot de Telegram está listo.");
});