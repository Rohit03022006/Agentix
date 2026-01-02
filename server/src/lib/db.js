import prismaClient from "./prismaClient.js";

const globalforPrisma = global;
const prisma = new PrismaClient();

if (process.env.NODE_ENV === "production") globalforPrisma.prisma = prisma;

export default prisma
