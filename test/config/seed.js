const { db, pool } = require("../../lib/db/db");
const {
  codes,
  rules,
  rule_metadata,
  code_system_aliases
} = require("../../db-schema");
const { sql } = require("drizzle-orm");

const HL7_SUD_CODE_ID = 1;
const HL7_R_CODE_ID = 4;

const KETAMINE_CODE_ID = 101;
const HALL_CODE_ID = 102;
const OPIOID_IV_CODE_ID = 103;
const OPIOID_CODE_ID = 104;
const HALL_GROUP_ID = 105;
const OPIOID_GROUP_ID = 106;

const SNOMED_SYSTEM_ID = 2;
const ICD10_SYSTEM_ID = 3;
const LOCAL_SYSTEM_ID = 1;

const WHY_42CFRPart2_METADATA_ID = 1;
const WHO_SLS_NAME_METADATA_ID = 2;

const seedData = async () => {
  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Insert data into codes table
      await tx
        .insert(codes)
        .values([
          {
            id: KETAMINE_CODE_ID,
            system_id: SNOMED_SYSTEM_ID,
            code: "724713006",
            display: "Harmful use of ketamine (disorder)",
            type: "code"
          },
          {
            id: HALL_CODE_ID,
            system_id: ICD10_SYSTEM_ID,
            code: "F16.20",
            display: "Hallucinogen dependence, uncomplicated",
            type: "code"
          },
          {
            id: OPIOID_IV_CODE_ID,
            system_id: SNOMED_SYSTEM_ID,
            code: "145121000119106",
            display: "Intravenous nondependent opioid abuse (disorder)",
            type: "code"
          },
          {
            id: OPIOID_CODE_ID,
            system_id: ICD10_SYSTEM_ID,
            code: "F11.1",
            display: "Opioid abuse",
            type: "code"
          },
          {
            id: HALL_GROUP_ID,
            system_id: LOCAL_SYSTEM_ID,
            code: "hallucinogen",
            display: "hallucinogen substance use",
            type: "group"
          },
          {
            id: OPIOID_GROUP_ID,
            system_id: LOCAL_SYSTEM_ID,
            code: "opiod",
            display: "opiod substance use",
            type: "group"
          }
        ])
        .onConflictDoNothing();

      // Insert data into code_group_mappings table
      await tx.insert(rules).values([
        { id: 101, code_id: KETAMINE_CODE_ID, group_id: HALL_GROUP_ID },
        { id: 102, code_id: HALL_CODE_ID, group_id: HALL_GROUP_ID },
        { id: 103, code_id: OPIOID_CODE_ID, group_id: OPIOID_GROUP_ID },
        { id: 104, code_id: OPIOID_IV_CODE_ID, group_id: OPIOID_GROUP_ID },
        { id: 105, code_id: OPIOID_GROUP_ID, group_id: HL7_SUD_CODE_ID },
        { id: 106, code_id: HALL_GROUP_ID, group_id: HL7_SUD_CODE_ID },
        { id: 107, code_id: HL7_SUD_CODE_ID, group_id: HL7_R_CODE_ID } //all SUD codes are Restricted
      ]);

      await tx
        .insert(code_system_aliases)
        .values([{ system_id: 1, alias: "" }]);

      await tx.insert(rule_metadata).values([
        { rule_id: 107, metadata_id: WHY_42CFRPart2_METADATA_ID },
        { rule_id: 107, metadata_id: WHO_SLS_NAME_METADATA_ID }
      ]);
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

const tearDownDB = async () => {
  await db.execute(sql`TRUNCATE rule_metadata;`);
  await db.execute(
    sql`DELETE FROM rules WHERE id IN (101, 102, 103, 104, 105, 106, 107);`
  );
  await db.execute(
    sql`DELETE FROM codes WHERE id IN 
    (${KETAMINE_CODE_ID}, 
    ${HALL_CODE_ID}, 
    ${OPIOID_IV_CODE_ID}, 
    ${OPIOID_CODE_ID}, 
    ${OPIOID_GROUP_ID}, 
    ${HALL_GROUP_ID});`
  );
  await db.execute(sql`DELETE FROM code_system_aliases WHERE system_id=1;`);
  await pool.end();
};

module.exports = { seedData, tearDownDB };
