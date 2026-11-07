import "server-only";
import { z } from "zod";
import { db, settings } from "./db";
import { requestJson, ServiceError } from "./github";

export function pricing(inputUpperBound:number,outputTokens=5500) {
  const input=Number(process.env.OPENAI_INPUT_USD_PER_MILLION),output=Number(process.env.OPENAI_OUTPUT_USD_PER_MILLION);
  if(!(input>0)||!(output>0)||!process.env.OPENAI_MODEL)throw new Error("MODEL_PRICING_NOT_CONFIGURED");
  return {input,output,reservation:(inputUpperBound*input+outputTokens*output)/1000000};
}
export async function requestModel(projectId:string,name:string,schema:z.ZodType,instructions:string,data:unknown,outputTokens=5500) {
  if(!process.env.OPENAI_API_KEY)throw new ServiceError("OPENAI_NOT_CONFIGURED",3600);
  const jsonSchema=z.toJSONSchema(schema),input=JSON.stringify(data);
  const inputUpperBound=Buffer.byteLength(input+instructions+JSON.stringify(jsonSchema),"utf8")+4096;
  if(inputUpperBound>220000)throw new ServiceError("INPUT_TOO_LARGE_REVIEW_REQUIRED",86400);
  const cost=pricing(inputUpperBound,outputTokens),config=await settings();
  const usageId=await db().begin(async tx=>{
    await tx`select pg_advisory_xact_lock(913528)`;
    const [used]=await tx`select count(*)::int as calls,coalesce(sum(coalesce(actual_cost,reserved_cost)),0)::float as cost from ai_usage where created_at>=date_trunc('month',now())`;
    if(used.calls>=config.monthlyCalls||used.cost+cost.reservation>config.monthlyBudget)throw new ServiceError("MONTHLY_BUDGET_EXCEEDED",86400);
    const [row]=await tx`insert into ai_usage(project_id,reserved_cost) values(${projectId},${cost.reservation}) returning id`;
    return row.id;
  });
  const responseSchema=z.object({status:z.string(),output:z.array(z.object({type:z.string(),content:z.array(z.object({type:z.string(),text:z.string().optional()})).optional()})).optional(),usage:z.object({input_tokens:z.number().int().nonnegative(),output_tokens:z.number().int().nonnegative()}).optional()});
  // Unknown outcomes retain their reservation; there is no immediate provider retry.
  const response=responseSchema.parse(await requestJson("https://api.openai.com/v1/responses",{
    method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({model:process.env.OPENAI_MODEL,instructions,input,store:false,max_output_tokens:outputTokens,text:{format:{type:"json_schema",name,strict:true,schema:jsonSchema}}}),
  },1));
  const estimatedCost=response.usage?(response.usage.input_tokens*cost.input+response.usage.output_tokens*cost.output)/1000000:cost.reservation;
  if(response.usage)await db()`update ai_usage set actual_cost=${estimatedCost},input_tokens=${response.usage.input_tokens},output_tokens=${response.usage.output_tokens},status='charged' where id=${usageId}`;
  if(response.status!=="completed")throw new ServiceError("AI_INCOMPLETE");
  const output=response.output?.flatMap(o=>o.content??[]).filter(c=>c.type==="output_text").map(c=>c.text).join("");
  if(!output)throw new ServiceError("AI_REFUSAL_OR_EMPTY");
  try{return {raw:JSON.parse(output) as unknown,usage:response.usage??{},estimatedCost};}
  catch{throw new ServiceError("AI_SCHEMA_INVALID");}
}
