import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(chatRouter);

export default router;
