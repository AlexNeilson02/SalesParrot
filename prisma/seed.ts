import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { detectReminders } from "../src/lib/reminders";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@salesparrot.app";
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Demo Rep", email, passwordHash },
  });

  const existing = await prisma.prospect.count({ where: { ownerId: user.id } });
  if (existing > 0) {
    console.log("Demo data already exists, skipping.");
    return;
  }

  const prospectsData = [
    {
      name: "Alicia Turner",
      address: "128 Maple St",
      city: "Springfield",
      state: "OH",
      zip: "45501",
      phone: "555-201-3344",
      email: "alicia.turner@example.com",
      status: "NEW" as const,
      note: "Talked at the door, seemed interested but busy with dinner. Call next week.",
    },
    {
      name: "Marcus Webb",
      address: "45 Birchwood Ave",
      city: "Springfield",
      state: "OH",
      zip: "45502",
      phone: "555-482-1190",
      email: "marcus.webb@example.com",
      status: "NOT_HOME" as const,
      note: "Not home, no car in driveway. Come back in spring, they mentioned doing yard work then.",
    },
    {
      name: "Priya Natarajan",
      address: "902 Oakridge Dr",
      city: "Springfield",
      state: "OH",
      zip: "45503",
      phone: "555-773-9081",
      email: "priya.n@example.com",
      status: "INTERESTED" as const,
      note: "Very interested, wants a quote. Email her the proposal in 3 days.",
    },
    {
      name: "Devon Carter",
      address: "17 Willow Ct",
      city: "Springfield",
      state: "OH",
      zip: "45504",
      phone: "555-664-2210",
      email: null,
      status: "SOLD" as const,
      note: "Signed up on the spot! Great conversation about the neighbors' referral program.",
    },
  ];

  for (const p of prospectsData) {
    const prospect = await prisma.prospect.create({
      data: {
        ownerId: user.id,
        name: p.name,
        address: p.address,
        city: p.city,
        state: p.state,
        zip: p.zip,
        phone: p.phone,
        email: p.email,
        status: p.status,
      },
    });

    const note = await prisma.note.create({
      data: { prospectId: prospect.id, authorId: user.id, body: p.note },
    });

    const reminders = detectReminders(p.note);
    for (const r of reminders) {
      await prisma.followUp.create({
        data: {
          prospectId: prospect.id,
          noteId: note.id,
          ownerId: user.id,
          dueAt: r.date,
          label: `${r.text} → ${r.label}`,
          method: p.phone ? "PHONE" : "IN_PERSON",
        },
      });
    }
  }

  console.log("Seeded demo account:");
  console.log("  email:    demo@salesparrot.app");
  console.log("  password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
