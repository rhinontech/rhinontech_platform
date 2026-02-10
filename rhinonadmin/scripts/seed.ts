// Run this script to seed MongoDB with default data
// Usage: npx tsx scripts/seed.ts

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://rhinonserver:rhinonserver@rhinonadminserver.lpggxtv.mongodb.net/rhinon_admin';

async function seed() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db();

        console.log('🌱 Seeding database...');

        // 1. Seed Roles
        const rolesCollection = db.collection('roles');
        await rolesCollection.deleteMany({}); // Clear existing

        const roles = [
            {
                name: 'superadmin',
                displayName: 'Super Admin',
                permissions: ['*'], // All permissions
                isSystemRole: true,
                createdAt: new Date(),
            },
            {
                name: 'admin',
                displayName: 'Admin',
                permissions: [
                    'view_dashboard',
                    'view_users',
                    'create_users',
                    'edit_users',
                    'view_roles',
                    'manage_roles',
                ],
                isSystemRole: false,
                createdAt: new Date(),
            },
            {
                name: 'support',
                displayName: 'Support',
                permissions: ['view_dashboard', 'view_users'],
                isSystemRole: false,
                createdAt: new Date(),
            },
        ];

        await rolesCollection.insertMany(roles);
        console.log('✅ Roles created:', roles.map(r => r.name).join(', '));

        // 2. Seed Default Super Admin User
        const usersCollection = db.collection('users');
        await usersCollection.deleteMany({}); // Clear existing

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const users = [
            {
                email: 'admin@rhinon.tech',
                password: hashedPassword,
                fullName: 'Super Admin',
                role: 'superadmin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        await usersCollection.insertMany(users);
        console.log('✅ Users created:');
        console.log('   📧 Email: admin@rhinon.tech');
        console.log('   🔑 Password: admin123');

        // 3. Create indexes
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await rolesCollection.createIndex({ name: 1 }, { unique: true });
        console.log('✅ Indexes created');

        console.log('');
        console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding error:', error);
    } finally {
        await client.close();
    }
}

seed();
