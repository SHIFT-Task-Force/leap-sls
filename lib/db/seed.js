const { db } = require("./db");
const { codes, metadata, code_group_mappings } = require("../../db-schema");

const SENSITIVITY_TAGGING_RULES = [
  {
    id: "sample-rule-1",
    basis: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "42CFRPart2",
      display: "42 CFR Part2"
    },
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "SUD",
    display: "substance use disorder information sensitivity",
    codeSets: [
      {
        system: "group",
        code: "ketamine",
        display: "ketamine substance use",
        codes: [
          {
            system: "http://snomed.info/sct",
            code: "724713006",
            display: "Harmful use of ketamine (disorder)"
          },
          {
            system: "http://hl7.org/fhir/sid/icd-10",
            code: "F19.1",
            display: "Other psychoactive substance abuse"
          }
        ]
      },
      {
        system: "group",
        code: "opiod",
        display: "opiod substance use",
        codes: [
          {
            system: "http://snomed.info/sct",
            code: "145121000119106",
            display: "Intravenous nondependent opioid abuse (disorder)"
          },
          {
            system: "http://hl7.org/fhir/sid/icd-10",
            code: "F11.1",
            display: "Opioid abuse"
          }
        ]
      }
    ]
  }
];

const CONFIDENTIALITY_TAGGING_RULES = [
  {
    id: "sample-rule-1",
    basis: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "42CFRPart2",
      display: "42 CFR Part2"
    },
    system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
    code: "R",
    display: "restricted",
    codes: [
      {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "SUD",
        display: "substance use disorder information sensitivity"
      },
      {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "ETH",
        display: "substance abuse information sensitivity"
      },
      {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "HIV",
        display: "HIV/AIDS information sensitivity"
      }
    ]
  }
];

async function seedDatabase() {
  // Insert Sensitivity Tagging Rules
  for (const rule of SENSITIVITY_TAGGING_RULES) {
    try {
      // Insert basis as a 'basis' type in the `codes` table or retrieve existing `basisId`
      const [basisRecord] = await db
        .insert(codes)
        .values({
          system: rule.basis.system,
          code: rule.basis.code,
          display: rule.basis.display,
          type: "basis"
        })
        .onConflictDoNothing()
        .returning();

      let basisId;

      if (basisRecord) {
        basisId = basisRecord.id; // Use the inserted `basisId`
      } else {
        // Retrieve the existing `basisId` if it already exists
        const existingBasis = await db.query.codes.findFirst({
          where: (b, { eq, and }) =>
            and(
              eq(b.system, rule.basis.system),
              eq(b.code, rule.basis.code),
              eq(b.type, "basis")
            )
        });

        if (existingBasis) {
          basisId = existingBasis.id;
        } else {
          console.error(
            `Could not find existing basis for ${rule.basis.system} - ${rule.basis.code}`
          );
          continue;
        }
      }

      // Insert sensitivity code (e.g., SUD) into the `codes` table
      const [sensitivityRecord] = await db
        .insert(codes)
        .values({
          system: rule.system,
          code: rule.code,
          display: rule.display,
          type: "sensitivity"
        })
        .onConflictDoNothing()
        .returning();

      const sensitivityId = sensitivityRecord?.id;

      if (!sensitivityId) {
        console.log(
          `Sensitivity code already exists: ${rule.system} - ${rule.code}`
        );
        continue;
      }

      // Insert the metadata linking sensitivity code and basis
      await db
        .insert(metadata)
        .values({
          code_id: sensitivityId,
          basis_id: basisId
        })
        .onConflictDoNothing();

      // Insert the codeSets (groups) into the `codes` and `code_group_mappings` tables
      for (const codeSet of rule.codeSets) {
        console.log("codeSet", codeSet);
        console.log("codeSet.code", codeSet.code);
        console.log("codeSet.system", codeSet.system);
        // Check if the group (codeSet) already exists
        const groupRecord = await db.query.codes.findFirst({
          where: (c, { eq, and }) =>
            and(
              eq(c.code, codeSet.code),
              eq(c.system, codeSet.system),
              eq(c.type, "group")
            )
        });

        let groupId;
        console.log("groupRecord", groupRecord);
        if (!groupRecord) {
          // If not found, insert the group
          const [newGroupRecord] = await db
            .insert(codes)
            .values({
              system: codeSet.system,
              code: codeSet.code,
              display: codeSet.display,
              type: "group"
            })
            .onConflictDoNothing()
            .returning();

          groupId = newGroupRecord?.id;
        } else {
          groupId = groupRecord.id; // If found, use the existing group ID
        }
        // Map the sensitivity to the group itself
        await db
          .insert(code_group_mappings)
          .values({
            group_id: sensitivityId,
            code_id: groupId
          })
          .onConflictDoNothing();

        // Insert mapping between group and its associated codes
        for (const code of codeSet.codes) {
          let codeRecord = await db.query.codes.findFirst({
            where: (c, { eq, and }) =>
              and(
                eq(c.system, code.system),
                eq(c.code, code.code),
                eq(c.type, "code")
              )
          });

          let codeId;

          if (!codeRecord) {
            // Insert the code if it doesn't exist
            const [newCodeRecord] = await db
              .insert(codes)
              .values({
                system: code.system,
                code: code.code,
                display: code.display,
                type: "code"
              })
              .onConflictDoNothing()
              .returning();

            codeId = newCodeRecord?.id;
          } else {
            codeId = codeRecord.id; // Use the existing codeId
          }

          // Insert mapping between group and its associated codes
          await db
            .insert(code_group_mappings)
            .values({
              group_id: groupId,
              code_id: codeId
            })
            .onConflictDoNothing();
        }
      }
    } catch (err) {
      console.error(`Error seeding sensitivity rule: ${err.message}`);
    }
  }

  // Insert Confidentiality Tagging Rules
  for (const rule of CONFIDENTIALITY_TAGGING_RULES) {
    try {
      // Insert basis as a 'basis' type in the `codes` table or retrieve existing `basisId`
      const [basisRecord] = await db
        .insert(codes)
        .values({
          system: rule.basis.system,
          code: rule.basis.code,
          display: rule.basis.display,
          type: "basis"
        })
        .onConflictDoNothing()
        .returning();

      let basisId;

      if (basisRecord) {
        basisId = basisRecord.id; // Use the inserted `basisId`
      } else {
        // Retrieve the existing `basisId` if it already exists
        const existingBasis = await db.query.codes.findFirst({
          where: (b, { eq, and }) =>
            and(
              eq(b.system, rule.basis.system),
              eq(b.code, rule.basis.code),
              eq(b.type, "basis")
            )
        });

        if (existingBasis) {
          basisId = existingBasis.id;
        } else {
          console.error(
            `Could not find existing basis for ${rule.basis.system} - ${rule.basis.code}`
          );
          continue;
        }
      }

      // Insert confidentiality code (e.g., R) into the `codes` table
      const [confidentialityRecord] = await db
        .insert(codes)
        .values({
          system: rule.system,
          code: rule.code,
          display: rule.display,
          type: "confidentiality"
        })
        .onConflictDoNothing()
        .returning();

      const confidentialityId = confidentialityRecord?.id;

      if (!confidentialityId) {
        console.log(
          `Confidentiality code already exists: ${rule.system} - ${rule.code}`
        );
        continue;
      }

      // Insert the metadata linking confidentiality code and basis
      await db
        .insert(metadata)
        .values({
          code_id: confidentialityId,
          basis_id: basisId
        })
        .onConflictDoNothing();

      // Map confidentiality to the sensitivity-related codes
      for (const code of rule.codes) {
        const sensitivityRecord = await db.query.codes.findFirst({
          where: (c, { eq, and }) =>
            and(
              eq(c.code, code.code),
              eq(c.system, code.system),
              eq(c.type, "sensitivity")
            )
        });

        if (sensitivityRecord) {
          await db
            .insert(code_group_mappings)
            .values({
              group_id: confidentialityId,
              code_id: sensitivityRecord.id
            })
            .onConflictDoNothing();
        }
      }
    } catch (err) {
      console.error(`Error seeding confidentiality rule: ${err.message}`);
    }
  }

  console.log("Seed completed");
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
