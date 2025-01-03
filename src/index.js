import app from "./app";
import { connectDB } from "./config/db";

app.listen(process.env.PORT, ()=> {
    connectDB();
    console.log(`listening on port ${process.env.PORT}`);
});