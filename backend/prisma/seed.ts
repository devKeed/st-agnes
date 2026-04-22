import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  AdminRole,
  ContentType,
  PrismaClient,
  ServiceType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const BCRYPT_COST = 12;

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'St Agnes Admin';

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to seed the super admin.',
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const admin = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: {
      name,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: AdminRole.SUPER_ADMIN,
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
  const rows: Array<{
    serviceType: ServiceType;
    displayName: string;
    description: string;
    durationMinutes: number;
  }> = [
    {
      serviceType: ServiceType.CUSTOM_DESIGN,
      displayName: 'Custom Design Consultation',
      description:
        'One-on-one consultation to design a bespoke piece. Includes measurements and sketch review.',
      durationMinutes: 90,
    },
    {
      serviceType: ServiceType.ALTERATION,
      displayName: 'Alteration Fitting',
      description:
        'Fitting appointment for garment alterations. Please bring the item(s) to be altered.',
      durationMinutes: 30,
    },
    {
      serviceType: ServiceType.RENTAL,
      displayName: 'Rental Fitting & Pickup',
      description:
        'Try on and collect reserved rental pieces. Final fit adjustments included.',
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
      content:
        'Initial terms & conditions placeholder. Replace this content via the admin UI before accepting bookings.',
      isActive: true,
      publishedAt: new Date(),
    },
  });

  console.log(`  ✓ TermsVersion: created v1.0 (id ${created.id})`);
}

async function seedSiteContent() {
  const rows: Array<{
    pageKey: string;
    contentType: ContentType;
    value: string;
  }> = [
    // ── HOME PAGE ──────────────────────────────────────────────
    { pageKey: 'home_hero_eyebrow', contentType: ContentType.TEXT, value: 'Spring / Summer 2026 Edit' },
    { pageKey: 'hero_title', contentType: ContentType.TEXT, value: 'Elegance, unhurried.' },
    { pageKey: 'hero_subtitle', contentType: ContentType.TEXT, value: "An atelier of bespoke design, precision alterations, and curated rentals — crafted for life's most considered moments." },
    { pageKey: 'home_hero_cta_primary', contentType: ContentType.TEXT, value: 'Explore the edit' },
    { pageKey: 'home_hero_cta_secondary', contentType: ContentType.TEXT, value: 'Book a fitting' },
    { pageKey: 'home_hero_image', contentType: ContentType.IMAGE, value: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2000&q=85' },
    { pageKey: 'home_intro_eyebrow', contentType: ContentType.TEXT, value: '01 — The House' },
    { pageKey: 'home_intro_title', contentType: ContentType.TEXT, value: 'A house built on considered craft — where every seam, silhouette, and stitch is an act of devotion.' },
    { pageKey: 'home_intro_body', contentType: ContentType.RICHTEXT, value: 'St Agnes is an atelier for those who prefer the quiet over the crowd. We design bespoke pieces for your most considered moments, tailor what you already love, and offer a curated rental archive for the occasions that call for something singular.' },
    { pageKey: 'home_intro_cta', contentType: ContentType.TEXT, value: 'Discover the house' },
    { pageKey: 'home_signature_eyebrow', contentType: ContentType.TEXT, value: '02 — Signature Edit' },
    { pageKey: 'home_signature_title', contentType: ContentType.TEXT, value: 'Playground \u201924 Collection' },
    { pageKey: 'home_signature_body', contentType: ContentType.TEXT, value: 'Seven sculpted pieces that capture our house code — soft structure, hand-finished detail, and a celebration of line.' },
    { pageKey: 'home_signature_cta', contentType: ContentType.TEXT, value: 'Shop the archive' },
    { pageKey: 'home_philosophy_eyebrow', contentType: ContentType.TEXT, value: '03 — Philosophy' },
    { pageKey: 'home_philosophy_title', contentType: ContentType.TEXT, value: 'Every piece begins as a conversation.' },
    { pageKey: 'home_philosophy_body', contentType: ContentType.RICHTEXT, value: 'We believe the most memorable garments are born of intent — from the first sketch to the final hand-finishing. Our process invites you into the atelier: to sit with fabric, to see the silhouette take form, to own something that is unmistakably yours.' },
    { pageKey: 'home_philosophy_image', contentType: ContentType.IMAGE, value: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=85' },
    { pageKey: 'home_stat_1_number', contentType: ContentType.TEXT, value: '12+' },
    { pageKey: 'home_stat_1_label', contentType: ContentType.TEXT, value: 'Years of craft' },
    { pageKey: 'home_stat_2_number', contentType: ContentType.TEXT, value: '400' },
    { pageKey: 'home_stat_2_label', contentType: ContentType.TEXT, value: 'Gowns delivered' },
    { pageKey: 'home_stat_3_number', contentType: ContentType.TEXT, value: '1:1' },
    { pageKey: 'home_stat_3_label', contentType: ContentType.TEXT, value: 'Client ratio' },
    { pageKey: 'home_services_eyebrow', contentType: ContentType.TEXT, value: '04 — Services' },
    { pageKey: 'home_services_title', contentType: ContentType.TEXT, value: 'Three ways to work with the house.' },
    { pageKey: 'home_press_logos', contentType: ContentType.TEXT, value: "Vogue, Harper's Bazaar, The Guardian, Marie Claire, Elle, Allure, BellaNaija, Yahoo" },
    { pageKey: 'home_journal_eyebrow', contentType: ContentType.TEXT, value: '05 — Journal' },
    { pageKey: 'home_journal_title', contentType: ContentType.TEXT, value: 'St Agnes Stories' },
    { pageKey: 'home_journal_cta', contentType: ContentType.TEXT, value: 'View all entries' },
    { pageKey: 'home_story_1_tag', contentType: ContentType.TEXT, value: 'Campaign' },
    { pageKey: 'home_story_1_date', contentType: ContentType.TEXT, value: 'March 2026' },
    { pageKey: 'home_story_1_title', contentType: ContentType.TEXT, value: 'Into the Garden — SS26' },
    { pageKey: 'home_story_1_excerpt', contentType: ContentType.RICHTEXT, value: 'Our spring campaign, shot between Lagos and Lisbon, explores memory, heritage, and the quiet drama of a season in bloom.' },
    { pageKey: 'home_story_1_image', contentType: ContentType.IMAGE, value: 'https://images.unsplash.com/photo-1508163356062-d2beca5e1aed?auto=format&fit=crop&w=1600&q=80' },
    { pageKey: 'home_story_2_tag', contentType: ContentType.TEXT, value: 'Journal' },
    { pageKey: 'home_story_2_date', contentType: ContentType.TEXT, value: 'February 2026' },
    { pageKey: 'home_story_2_title', contentType: ContentType.TEXT, value: 'On the Quiet Power of Detail' },
    { pageKey: 'home_story_2_excerpt', contentType: ContentType.RICHTEXT, value: 'A meditation on hand-finishing, drape, and the parts of a garment that should never be rushed.' },
    { pageKey: 'home_story_2_image', contentType: ContentType.IMAGE, value: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80' },
    { pageKey: 'home_story_3_tag', contentType: ContentType.TEXT, value: 'Clients' },
    { pageKey: 'home_story_3_date', contentType: ContentType.TEXT, value: 'January 2026' },
    { pageKey: 'home_story_3_title', contentType: ContentType.TEXT, value: 'Dressing the Day of a Lifetime' },
    { pageKey: 'home_story_3_excerpt', contentType: ContentType.RICHTEXT, value: 'Five brides, five silhouettes — and the six-month journey behind each gown.' },
    { pageKey: 'home_story_3_image', contentType: ContentType.IMAGE, value: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' },
    { pageKey: 'home_cta_eyebrow', contentType: ContentType.TEXT, value: '06 — By Appointment' },
    { pageKey: 'home_cta_title', contentType: ContentType.TEXT, value: "Step inside the atelier. Let's begin your piece." },
    { pageKey: 'home_cta_body', contentType: ContentType.RICHTEXT, value: 'Book a private consultation to define your vision — from fabric and silhouette to the occasion it will be worn for.' },
    { pageKey: 'home_cta_button', contentType: ContentType.TEXT, value: 'Schedule a consultation' },
    { pageKey: 'home_cta_image', contentType: ContentType.IMAGE, value: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=2000&q=85' },
    // ── ABOUT PAGE ─────────────────────────────────────────────
    { pageKey: 'about_hero_eyebrow', contentType: ContentType.TEXT, value: 'The Atelier' },
    { pageKey: 'about_title', contentType: ContentType.TEXT, value: 'Craftsmanship, with intent.' },
    { pageKey: 'about_hero_image', contentType: ContentType.IMAGE, value: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=2000&q=85' },
    { pageKey: 'about_body', contentType: ContentType.RICHTEXT, value: 'St Agnes is an atelier for those who value the slower, more considered way of making. We draw from modern silhouettes and traditional couture technique — always in service of the person who will wear the piece.' },
    { pageKey: 'about_philosophy_eyebrow', contentType: ContentType.TEXT, value: '01 — Philosophy' },
    { pageKey: 'about_philosophy_body', contentType: ContentType.RICHTEXT, value: 'Founded on the belief that clothing should hold meaning, we work closely with a small circle of clients each season. Every bespoke piece is designed to be worn — and remembered.' },
    { pageKey: 'about_services_eyebrow', contentType: ContentType.TEXT, value: '02 — Services' },
    { pageKey: 'about_services_title', contentType: ContentType.TEXT, value: 'Three disciplines, one standard.' },
    { pageKey: 'about_services_cta', contentType: ContentType.TEXT, value: 'Begin' },
    { pageKey: 'about_process_eyebrow', contentType: ContentType.TEXT, value: '03 — Process' },
    { pageKey: 'about_process_title', contentType: ContentType.TEXT, value: 'From first thread to final fitting.' },
    { pageKey: 'about_process_1_title', contentType: ContentType.TEXT, value: 'Consultation' },
    { pageKey: 'about_process_1_body', contentType: ContentType.RICHTEXT, value: 'We begin with a private conversation — your occasion, your silhouette, the shape of what you imagine.' },
    { pageKey: 'about_process_2_title', contentType: ContentType.TEXT, value: 'Sketch & Selection' },
    { pageKey: 'about_process_2_body', contentType: ContentType.RICHTEXT, value: 'Mood boards, hand sketches, and fabric swatches — the piece takes form before a single stitch is made.' },
    { pageKey: 'about_process_3_title', contentType: ContentType.TEXT, value: 'Atelier' },
    { pageKey: 'about_process_3_body', contentType: ContentType.RICHTEXT, value: 'Our artisans construct, drape, and hand-finish. Two fittings refine proportion and fall.' },
    { pageKey: 'about_process_4_title', contentType: ContentType.TEXT, value: 'Handover' },
    { pageKey: 'about_process_4_body', contentType: ContentType.RICHTEXT, value: 'Delivered with care — garment bag, care notes, and a direct line to the studio for alterations.' },
    { pageKey: 'about_cta_title', contentType: ContentType.TEXT, value: 'Ready to begin your piece?' },
    { pageKey: 'about_cta_primary', contentType: ContentType.TEXT, value: 'Schedule a consultation' },
    { pageKey: 'about_cta_secondary', contentType: ContentType.TEXT, value: 'See our work' },
    // ── GALLERY PAGE ───────────────────────────────────────────
    { pageKey: 'gallery_eyebrow', contentType: ContentType.TEXT, value: 'Index — Gallery' },
    { pageKey: 'gallery_title', contentType: ContentType.TEXT, value: 'A quiet archive of collection & muse.' },
    { pageKey: 'gallery_intro', contentType: ContentType.RICHTEXT, value: "A living record of the atelier's work — seasonal collections alongside the muses who wear them. Browse by chapter below." },
    { pageKey: 'gallery_tab_collection', contentType: ContentType.TEXT, value: 'Collection' },
    { pageKey: 'gallery_tab_muse', contentType: ContentType.TEXT, value: 'Muse' },
    // ── RENTALS PAGE ───────────────────────────────────────────
    { pageKey: 'rentals_eyebrow', contentType: ContentType.TEXT, value: 'Index — Rentals' },
    { pageKey: 'rentals_title', contentType: ContentType.TEXT, value: 'The rental archive.' },
    { pageKey: 'rentals_intro', contentType: ContentType.RICHTEXT, value: 'A rotating selection of signature pieces, available for weddings, galas, and single-evening moments. All rentals include a pre-fitting and dedicated styling.' },
    { pageKey: 'rentals_cta_title', contentType: ContentType.TEXT, value: 'Looking for something specific? We can source it.' },
    { pageKey: 'rentals_cta_button', contentType: ContentType.TEXT, value: 'Begin a consultation' },
    { pageKey: 'rentals_empty', contentType: ContentType.TEXT, value: 'The archive is being refreshed. Please check back shortly.' },
    // ── BOOKING PAGE ───────────────────────────────────────────
    { pageKey: 'booking_eyebrow', contentType: ContentType.TEXT, value: 'Concierge — Booking' },
    { pageKey: 'booking_title', contentType: ContentType.TEXT, value: 'A private appointment.' },
    { pageKey: 'booking_intro', contentType: ContentType.RICHTEXT, value: "Choose your service, pick from real-time open slots, and confirm in minutes. You'll receive a manage link to reschedule or cancel in accordance with our studio policy." },
    // ── SERVICES (shared) ──────────────────────────────────────
    { pageKey: 'service_custom_design_title', contentType: ContentType.TEXT, value: 'Custom Design' },
    { pageKey: 'service_custom_design_description', contentType: ContentType.RICHTEXT, value: 'Bespoke pieces crafted to your event, silhouette, and personality.' },
    { pageKey: 'service_alteration_title', contentType: ContentType.TEXT, value: 'Alteration' },
    { pageKey: 'service_alteration_description', contentType: ContentType.RICHTEXT, value: 'Precision tailoring and fit correction for existing outfits.' },
    { pageKey: 'service_rental_title', contentType: ContentType.TEXT, value: 'Rental' },
    { pageKey: 'service_rental_description', contentType: ContentType.RICHTEXT, value: 'Curated luxury rentals for weddings, red carpets, and special events.' },
    // ── FOOTER ─────────────────────────────────────────────────
    { pageKey: 'footer_newsletter_eyebrow', contentType: ContentType.TEXT, value: 'Correspondence' },
    { pageKey: 'footer_newsletter_title', contentType: ContentType.TEXT, value: 'Letters from the atelier.' },
    { pageKey: 'footer_newsletter_body', contentType: ContentType.RICHTEXT, value: 'Occasional dispatches — new collections, studio stories, and first access to private fittings. No noise, only the things worth keeping.' },
    { pageKey: 'footer_studio_eyebrow', contentType: ContentType.TEXT, value: 'Studio' },
    { pageKey: 'footer_studio_hours', contentType: ContentType.TEXT, value: 'By appointment only' },
    { pageKey: 'footer_studio_city', contentType: ContentType.TEXT, value: 'Lagos, Nigeria' },
    { pageKey: 'footer_studio_email', contentType: ContentType.TEXT, value: 'studio@stagnes.com' },
    { pageKey: 'footer_social_instagram', contentType: ContentType.TEXT, value: '' },
    { pageKey: 'footer_social_youtube', contentType: ContentType.TEXT, value: '' },
    { pageKey: 'footer_social_tiktok', contentType: ContentType.TEXT, value: '' },
    { pageKey: 'footer_copyright_name', contentType: ContentType.TEXT, value: 'St Agnes Atelier' },
    { pageKey: 'footer_tagline', contentType: ContentType.TEXT, value: 'Made with care' },
    // ── CONTACT ────────────────────────────────────────────────
    { pageKey: 'contact_email', contentType: ContentType.TEXT, value: 'hello@stagnes.com' },
    { pageKey: 'contact_phone', contentType: ContentType.TEXT, value: '+234 000 000 0000' },
    { pageKey: 'instagram_handle', contentType: ContentType.TEXT, value: '@stagnes' },
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
