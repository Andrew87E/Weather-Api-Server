import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        await prisma.$connect()
        console.log('Successfully connected to database')

        // Test query
        const result = await prisma.$queryRaw`SELECT current_timestamp`
        console.log('Query result:', result)
    } catch (error) {
        console.error('Error connecting to database:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()