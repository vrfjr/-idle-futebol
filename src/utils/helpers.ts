const SURNAMES = [
  "Silva","Rodrigues","Santos","Costa","Pereira","Alves","Neto","Lima",
  "Ferreira","Ribeiro","Martins","Carvalho","Rocha","Gomes","Araújo",
  "Barbosa","Melo","Ramos","Cruz","Teixeira","Lopes","Pinto","Cunha",
  "Moreira","Cardoso","Oliveira","Souza","Monteiro","Campos","Vaz",
];
let _ni = 0;
export function freshName(): string {
  const n = SURNAMES[_ni % SURNAMES.length];
  const suffix = _ni >= SURNAMES.length ? ` ${Math.floor(_ni/SURNAMES.length)+1}` : "";
  _ni++;
  return n + suffix;
}
export function fmt(n: number): string {
  if(n>=1e6) return `${(n/1e6).toFixed(1)}M`;
  if(n>=1e3) return `${(n/1e3).toFixed(1)}K`;
  return String(Math.floor(n));
}
