import { Pool } from "pg";

//used to grab database variables from env.local and conenct to it
// aparently it can find the variables automatically which is really cool.
const db = new Pool();

export default db;