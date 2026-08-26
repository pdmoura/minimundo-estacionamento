const pendingSectorModelResponse = () =>
  Response.json(
    {
      error: "A API de setores ainda aguarda a definição do modelo Sector.",
    },
    { status: 501 },
  );

export async function GET() {
  // TODO: conectar o Prisma Client compartilhado e consultar o modelo Sector
  // depois que o schema e os nomes definitivos dos campos forem integrados.
  return pendingSectorModelResponse();
}

export async function POST(_request: Request) {
  // TODO: validar o corpo conforme o schema definitivo e criar um Sector
  // usando o Prisma Client compartilhado.
  return pendingSectorModelResponse();
}
