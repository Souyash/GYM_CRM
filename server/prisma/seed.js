"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding IronVault Gym CRM database...');
    // 1. Clean existing records for fresh seed
    await prisma.notificationLog.deleteMany();
    await prisma.failedAccessLog.deleteMany();
    await prisma.attendanceEntry.deleteMany();
    await prisma.deviceChangeRequest.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();
    await prisma.facility.deleteMany();
    // 2. Create physical facility with 50-meter geofence coordinates
    // Coordinates set to San Francisco Market St entrance or generic GPS: (37.774929, -122.419416)
    const facility = await prisma.facility.create({
        data: {
            name: 'IronVault Apex Fitness Downtown',
            address: '500 Market Street, Suite 100, San Francisco, CA 94105',
            latitude: 37.774929,
            longitude: -122.419416,
            geofenceRadiusMeters: 50.0,
            staticQrCodeHash: 'FACILITY_IV_APEX_DOWNTOWN_STATIC_2026',
            ownerContactEmail: 'owner@ironvaultgym.com',
            ownerContactPhone: '+1-555-019-8800'
        }
    });
    console.log(`Facility created: ${facility.name} (ID: ${facility.id})`);
    // 3. Password hashes
    const adminPassHash = await bcryptjs_1.default.hash('Admin@12345', 10);
    const managerPassHash = await bcryptjs_1.default.hash('Manager@12345', 10);
    const memberPassHash = await bcryptjs_1.default.hash('Member@12345', 10);
    // 4. Create Super Admin (Owner)
    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@ironvaultgym.com',
            fullName: 'Marcus Vance (Owner)',
            passwordHash: adminPassHash,
            role: 'SUPER_ADMIN',
            phone: '+1-555-019-8800',
            facilityId: facility.id,
            deviceStatus: 'NORMAL'
        }
    });
    // 5. Create Manager (Staff)
    const manager = await prisma.user.create({
        data: {
            email: 'manager@ironvaultgym.com',
            fullName: 'Sarah Jenkins (Desk Manager)',
            passwordHash: managerPassHash,
            role: 'MANAGER',
            phone: '+1-555-019-4422',
            facilityId: facility.id,
            boundDeviceId: 'DEVICE_STAFF_IPAD_DESK_01',
            boundDeviceName: 'iPad Pro Desk Terminal',
            deviceStatus: 'NORMAL'
        }
    });
    // 6. Member 1: Active Subscription & Bound Device (John Doe)
    const memberActive = await prisma.user.create({
        data: {
            email: 'john.doe@example.com',
            fullName: 'John Doe',
            passwordHash: memberPassHash,
            role: 'MEMBER',
            phone: '+1-555-012-3456',
            facilityId: facility.id,
            boundDeviceId: 'DEVICE_SAMSUNG_GALAXY_S24',
            boundDeviceName: 'Samsung Galaxy S24 Ultra (Android 14)',
            deviceStatus: 'NORMAL',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
        }
    });
    // Active Subscription: valid for next 30 days
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.create({
        data: {
            userId: memberActive.id,
            planName: 'Monthly Pro Access',
            price: 65.0,
            startDate: now,
            endDate: thirtyDaysLater,
            status: 'ACTIVE',
            deskBilledById: manager.id,
            paymentMethod: 'CARD'
        }
    });
    // 7. Member 2: Expired Subscription for Threat Testing (Alice Smith)
    const memberExpired = await prisma.user.create({
        data: {
            email: 'alice.smith@example.com',
            fullName: 'Alice Smith',
            passwordHash: memberPassHash,
            role: 'MEMBER',
            phone: '+1-555-014-7890',
            facilityId: facility.id,
            boundDeviceId: 'DEVICE_IPHONE_15_PRO',
            boundDeviceName: 'iPhone 15 Pro (iOS 17)',
            deviceStatus: 'NORMAL',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
        }
    });
    // Expired Subscription: expired 5 days ago
    const thirtyFiveDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    await prisma.subscription.create({
        data: {
            userId: memberExpired.id,
            planName: 'Quarterly Elite Pass',
            price: 165.0,
            startDate: thirtyFiveDaysAgo,
            endDate: fiveDaysAgo,
            status: 'EXPIRED',
            deskBilledById: manager.id,
            paymentMethod: 'CASH'
        }
    });
    // 8. Member 3: Brand New Member (No bound device yet - for 1st login binding test)
    const memberNew = await prisma.user.create({
        data: {
            email: 'bob.wilson@example.com',
            fullName: 'Bob Wilson',
            passwordHash: memberPassHash,
            role: 'MEMBER',
            phone: '+1-555-018-9911',
            facilityId: facility.id,
            boundDeviceId: null, // Will bind on 1st login
            deviceStatus: 'NORMAL',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
        }
    });
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    await prisma.subscription.create({
        data: {
            userId: memberNew.id,
            planName: 'Annual VIP Membership',
            price: 540.0,
            startDate: now,
            endDate: oneYearLater,
            status: 'ACTIVE',
            deskBilledById: manager.id,
            paymentMethod: 'ONLINE'
        }
    });
    console.log('Seeding complete! Default test credentials:');
    console.log('---------------------------------------------------------');
    console.log('👑 Super Admin (Owner): admin@ironvaultgym.com / Admin@12345');
    console.log('🧑‍💼 Manager (Staff):      manager@ironvaultgym.com / Manager@12345');
    console.log('🏃 Member 1 (Active):    john.doe@example.com / Member@12345 (Device: DEVICE_SAMSUNG_GALAXY_S24)');
    console.log('⚠️ Member 2 (Expired):   alice.smith@example.com / Member@12345 (Device: DEVICE_IPHONE_15_PRO)');
    console.log('🆕 Member 3 (Unbound):   bob.wilson@example.com / Member@12345 (Device: null - binds on 1st login)');
    console.log('---------------------------------------------------------');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
