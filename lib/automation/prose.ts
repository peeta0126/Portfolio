export function hasInlineEvidence(text:string) {return /\[\s*(?:근거|출처|evidence|source)\s*[:：][^\]]*\]/i.test(text);}
