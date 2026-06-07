import fs from "fs";
import path from "path";
import Ajv, { type ErrorObject } from "ajv";
import type { FightPerformance } from "@/src/types/fights";

const schemaPath = path.join(process.cwd(), ".", "pvp_fight_schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8")) as object;
const ajv = new Ajv({ allErrors: true });

ajv.addSchema(schema, "pvp_fight");

const validateFightArray = ajv.compile({ $ref: "pvp_fight" });
const validateSingleFight = ajv.compile({ $ref: "pvp_fight#/definitions/FightPerformance" });

type ValidationResult =
  | {
      isValid: true;
      fights: FightPerformance[];
    }
  | {
      isValid: false;
      errors: ErrorObject[] | null | undefined;
    };

export function validateFightPayload(body: unknown): ValidationResult {
  const isArray = Array.isArray(body);
  const valid = isArray ? validateFightArray(body) : validateSingleFight(body);

  if (valid) {
    return {
      isValid: true,
      fights: (isArray ? body : [body]) as FightPerformance[],
    };
  }

  return {
    isValid: false,
    errors: isArray ? validateFightArray.errors : validateSingleFight.errors,
  };
}
