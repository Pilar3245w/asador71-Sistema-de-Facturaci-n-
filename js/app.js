import { ProductoModel } from "./models/ProductoModel.js";
import { PedidoModel } from "./models/PedidoModel.js";
import { ClienteModel } from "./models/ClienteModel.js";
import { Vista } from "./views/Vista.js";
import { AppController } from "./controllers/AppController.js";

new AppController(new ProductoModel(), new PedidoModel(), new Vista(), new ClienteModel());