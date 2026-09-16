import fs from 'fs';
import path from 'path';
import prisma from './prisma.js';

const SNAPSHOT_DIR = path.resolve(process.cwd(), 'data');
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'db_snapshot.json');

/**
 * Ensures the snapshot directory exists.
 */
function ensureSnapshotDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

/**
 * Exports current database records to a JSON snapshot.
 */
export async function exportDatabaseSnapshot(): Promise<{ success: boolean; path?: string; counts?: Record<string, number>; error?: string }> {
  try {
    ensureSnapshotDir();

    const [gyms, users, subscriptions, healthProfiles, documents, attendance] = await Promise.all([
      prisma.gym.findMany(),
      prisma.user.findMany(),
      prisma.subscription.findMany(),
      prisma.memberHealthProfile.findMany(),
      prisma.memberEnrollmentDocument.findMany(),
      prisma.attendanceEntry.findMany({
        take: 500,
        orderBy: { scannedAt: 'desc' }
      })
    ]);

    const snapshotData = {
      exportedAt: new Date().toISOString(),
      gyms,
      users,
      subscriptions,
      healthProfiles,
      documents,
      attendance
    };

    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshotData, null, 2), 'utf-8');

    return {
      success: true,
      path: SNAPSHOT_FILE,
      counts: {
        gyms: gyms.length,
        users: users.length,
        subscriptions: subscriptions.length,
        healthProfiles: healthProfiles.length,
        documents: documents.length,
        attendance: attendance.length
      }
    };
  } catch (err: any) {
    console.error('[DB Persistence] Error exporting snapshot:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Auto-restores database records from snapshot if the database is fresh/empty.
 */
export async function restoreDatabaseSnapshotIfEmpty(): Promise<boolean> {
  try {
    if (!fs.existsSync(SNAPSHOT_FILE)) {
      return false;
    }

    const userCount = await prisma.user.count();
    if (userCount > 0) {
      // Database already has records, no need to overwrite
      return false;
    }

    console.log('[DB Persistence] Fresh/empty database detected. Auto-restoring from persistent snapshot...');
    const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
    const data = JSON.parse(raw);

    // 1. Restore Gyms
    if (Array.isArray(data.gyms)) {
      for (const g of data.gyms) {
        await prisma.gym.upsert({
          where: { id: g.id },
          update: {},
          create: g
        });
      }
    }

    // 2. Restore Users
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        await prisma.user.upsert({
          where: { id: u.id },
          update: {},
          create: u
        });
      }
    }

    // 3. Restore Subscriptions
    if (Array.isArray(data.subscriptions)) {
      for (const s of data.subscriptions) {
        await prisma.subscription.upsert({
          where: { id: s.id },
          update: {},
          create: {
            ...s,
            startDate: new Date(s.startDate),
            endDate: new Date(s.endDate),
            createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
            lastExpiryAlertSentAt: s.lastExpiryAlertSentAt ? new Date(s.lastExpiryAlertSentAt) : undefined
          }
        });
      }
    }

    // 4. Restore Member Health Profiles
    if (Array.isArray(data.healthProfiles)) {
      for (const h of data.healthProfiles) {
        await prisma.memberHealthProfile.upsert({
          where: { id: h.id },
          update: {},
          create: {
            ...h,
            createdAt: h.createdAt ? new Date(h.createdAt) : undefined,
            updatedAt: h.updatedAt ? new Date(h.updatedAt) : undefined
          }
        });
      }
    }

    // 5. Restore Enrollment Documents
    if (Array.isArray(data.documents)) {
      for (const d of data.documents) {
        await prisma.memberEnrollmentDocument.upsert({
          where: { id: d.id },
          update: {},
          create: {
            ...d,
            createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
            updatedAt: d.updatedAt ? new Date(d.updatedAt) : undefined
          }
        });
      }
    }

    console.log(`✅ [DB Persistence] Database successfully recovered from snapshot (${data.users?.length || 0} users, ${data.gyms?.length || 0} gyms).`);
    return true;
  } catch (err: any) {
    console.error('[DB Persistence] Error restoring from snapshot:', err);
    return false;
  }
}

/**
 * Initializes automatic periodic database snapshots and graceful shutdown hooks.
 */
export function initDatabasePersistence(): void {
  // Check if restore is needed on boot
  restoreDatabaseSnapshotIfEmpty().catch(console.error);

  // Take periodic snapshots every 30 minutes
  setInterval(() => {
    exportDatabaseSnapshot()
      .then((res) => {
        if (res.success) {
          console.log(`💾 [DB Persistence] Periodic snapshot saved: ${res.counts?.users || 0} users, ${res.counts?.gyms || 0} gyms.`);
        }
      })
      .catch(console.error);
  }, 30 * 60 * 1000);

  // Save snapshot on process exit
  const handleExit = async () => {
    console.log('💾 [DB Persistence] Process exiting, exporting final database snapshot...');
    try {
      await exportDatabaseSnapshot();
    } catch (e) {
      // Ignore
    }
  };

  process.on('SIGTERM', handleExit);
  process.on('SIGINT', handleExit);
}
