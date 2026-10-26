This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase e painel administrativo

Configure as variáveis de [`.env.example`](./.env.example) no ambiente do servidor. `SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_URL` devem apontar para o mesmo projeto; a chave `SUPABASE_SERVICE_ROLE_KEY` e `ADMIN_SESSION_SECRET` são privadas e nunca devem usar o prefixo `NEXT_PUBLIC_`.

Crie a conta do administrador em **Supabase Auth** com e-mail e senha e configure o mesmo e-mail em `ADMIN_EMAIL`. O login valida a senha pelo Supabase Auth e só emite a sessão administrativa assinada quando o e-mail autenticado corresponde à allowlist. Não configure uma senha no código ou no banco. Reinicie o servidor depois de alterar variáveis de ambiente.

As tabelas de agendamento usam RLS e não permitem consulta direta por clientes anônimos ou autenticados. As rotas do servidor consultam o banco e retornam apenas os campos necessários. A consulta de “Meus serviços” por telefone exibe um resumo sem nome, telefone ou observações; para cancelar ou remarcar, o cliente confirma a posse do telefone pelo Supabase Auth.

Datas e horários de atendimento são tratados como horário civil de `America/Sao_Paulo`. As migrações de `supabase/migrations` devem estar aplicadas no projeto Supabase para que a agenda e a restrição contra conflitos funcionem.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
