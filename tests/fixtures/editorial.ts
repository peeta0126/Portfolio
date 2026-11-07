import { publicWritingEntries } from "../../lib/automation/editorial";
import type { Generated } from "../../lib/automation/schema";

export const emptyPortfolio={background:"",goal:"",roleSummary:"",responsibilities:[],architectureLayers:[],userFlow:[],result:"",limitations:[],retrospectiveDraft:""};
export function mockWriting(value:unknown) {
  const raw=value as Generated;
  const result={...raw,portfolio:raw.portfolio??emptyPortfolio};
  return {...result,fieldEvidence:raw.fieldEvidence??publicWritingEntries(result).map(([field])=>({field,factIds:["routing"]}))};
}
