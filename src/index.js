import app from "./app.js";
import { connectDB } from "./config/db.js";

app.listen(process.env.PORT, ()=> {
    connectDB();
    console.log(`listening on port ${process.env.PORT}`);
    console.log("Bot de Telegram está listo.");
});