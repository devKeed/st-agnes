"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const BCRYPT_COST = 12;
async function seedAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME ?? 'St Agnes Admin';
    if (!email || !password) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to seed the super admin.');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const admin = await prisma.adminUser.upsert({
        where: { email: email.toLowerCase() },
        update: {
            name,
            role: client_1.AdminRole.SUPER_ADMIN,
            isActive: true,
        },
        create: {
            email: email.toLowerCase(),
            passwordHash,
            name,
            role: client_1.AdminRole.SUPER_ADMIN,
        },
    });
    console.log(`  ✓ AdminUser (SUPER_ADMIN): ${admin.email}`);
}
async function seedBusinessHours() {
    const rows = [
        { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true },
        { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isClosed: false },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00', isClosed: false },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00', isClosed: false },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00', isClosed: false },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00', isClosed: false },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '14:00', isClosed: false },
    ];
    for (const row of rows) {
        await prisma.businessHours.upsert({
            where: { dayOfWeek: row.dayOfWeek },
            update: {
                openTime: row.openTime,
                closeTime: row.closeTime,
                isClosed: row.isClosed,
            },
            create: row,
        });
    }
    console.log(`  ✓ BusinessHours: ${rows.length} rows`);
}
async function seedServiceTypes() {
    const rows = [
        {
            serviceType: client_1.ServiceType.CUSTOM_DESIGN,
            displayName: 'Custom Design Consultation',
            description: 'One-on-one consultation to design a bespoke piece. Includes measurements and sketch review.',
            durationMinutes: 90,
        },
        {
            serviceType: client_1.ServiceType.ALTERATION,
            displayName: 'Alteration Fitting',
            description: 'Fitting appointment for garment alterations. Please bring the item(s) to be altered.',
            durationMinutes: 30,
        },
        {
            serviceType: client_1.ServiceType.RENTAL,
            displayName: 'Rental Fitting & Pickup',
            description: 'Try on and collect reserved rental pieces. Final fit adjustments included.',
            durationMinutes: 60,
        },
    ];
    for (const row of rows) {
        await prisma.serviceTypeConfig.upsert({
            where: { serviceType: row.serviceType },
            update: {
                displayName: row.displayName,
                description: row.description,
                durationMinutes: row.durationMinutes,
                isActive: true,
            },
            create: { ...row, isActive: true },
        });
    }
    console.log(`  ✓ ServiceTypeConfig: ${rows.length} rows`);
}
async function seedTerms() {
    const existing = await prisma.termsVersion.findFirst({
        where: { versionLabel: 'v1.0' },
    });
    if (existing) {
        console.log(`  ✓ TermsVersion: v1.0 already present (id ${existing.id})`);
        return;
    }
    const created = await prisma.termsVersion.create({
        data: {
            versionLabel: 'v1.0',
            content: 'Initial terms & conditions placeholder. Replace this content via the admin UI before accepting bookings.',
            isActive: true,
            publishedAt: new Date(),
        },
    });
    console.log(`  ✓ TermsVersion: created v1.0 (id ${created.id})`);
}
async function seedSiteContent() {
    const rows = [
        { pageKey: 'hero_title', contentType: client_1.ContentType.TEXT, value: 'St Agnes' },
        {
            pageKey: 'hero_subtitle',
            contentType: client_1.ContentType.TEXT,
            value: 'Fashion, reimagined.',
        },
        { pageKey: 'about_title', contentType: client_1.ContentType.TEXT, value: 'About' },
        {
            pageKey: 'about_body',
            contentType: client_1.ContentType.RICHTEXT,
            value: '<p>Replace this placeholder copy with the St Agnes brand story via the admin UI.</p>',
        },
        {
            pageKey: 'contact_email',
            contentType: client_1.ContentType.TEXT,
            value: 'hello@stagnes.com',
        },
        {
            pageKey: 'contact_phone',
            contentType: client_1.ContentType.TEXT,
            value: '+234 000 000 0000',
        },
        {
            pageKey: 'instagram_handle',
            contentType: client_1.ContentType.TEXT,
            value: '@stagnes',
        },
    ];
    for (const row of rows) {
        await prisma.siteContent.upsert({
            where: { pageKey: row.pageKey },
            update: { contentType: row.contentType },
            create: row,
        });
    }
    console.log(`  ✓ SiteContent: ${rows.length} rows (existing values preserved)`);
}
async function main() {
    console.log('Seeding database…');
    await seedAdmin();
    await seedBusinessHours();
    await seedServiceTypes();
    await seedTerms();
    await seedSiteContent();
    console.log('Seed complete.');
}
main()
    .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map