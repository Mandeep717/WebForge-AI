import "dotenv/config";
import { connect, disconnect } from "mongoose";
import { hash } from "bcryptjs";

import { UserModel } from "./Models/user.models.js";
import { ResourceModel } from "./Models/resource.models.js";

const adminEmail = "admin@webforge.com";
const userEmail = "student@webforge.com";
const password = "Password@123";

async function seed() {
  await connect(process.env.MONGO_URI);

  const passwordHash = await hash(password, 12);

  const admin = await UserModel.findOneAndUpdate(
    { email: adminEmail },
    {
      name: "WebForge Admin",
      email: adminEmail,
      password: passwordHash,
      role: "ADMIN",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const user = await UserModel.findOneAndUpdate(
    { email: userEmail },
    {
      name: "Demo Student",
      email: userEmail,
      password: passwordHash,
      role: "USER",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const resources = [
    {
      resourceName: "AI Lab",
      resourceType: "Laboratory",
      resourceLocation: "Block A - 201",
      availabilityStatus: "AVAILABLE",
      resourceCapacity: 60,
      createdBy: admin._id,
    },
    {
      resourceName: "Seminar Hall A",
      resourceType: "Seminar Halls",
      resourceLocation: "Main Block - Ground Floor",
      availabilityStatus: "AVAILABLE",
      resourceCapacity: 150,
      createdBy: admin._id,
    },
    {
      resourceName: "Sports Ground",
      resourceType: "Sports Facilities",
      resourceLocation: "Sports Complex",
      availabilityStatus: "AVAILABLE",
      resourceCapacity: 100,
      createdBy: admin._id,
    },
  ];

  for (const resource of resources) {
    await ResourceModel.findOneAndUpdate(
      { resourceName: resource.resourceName },
      resource,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log("Seed completed.");
  console.log(`Admin: ${adminEmail} / ${password}`);
  console.log(`User:  ${userEmail} / ${password}`);

  await disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await disconnect();
  process.exit(1);
});
