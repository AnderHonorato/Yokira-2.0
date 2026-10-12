// API da Yōkira 2.0 — Express servindo o catálogo e, em produção, o build do front
import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rotasCatalogo } from './rotas/catalogo.js';
import { rotasVitrine } from './rotas/vitrine.js';

const app = express();
const PORTA = Number(process.env.PORTA) || 3333;
const pastaWeb = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'dist');

app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.get('/api/saude', (_req, res) => res.json({ ok: true }));
app.use('/api', rotasCatalogo, rotasVitrine);
app.use('/api', (_req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Em produção (npm run build && npm start) o mesmo servidor entrega o site
if (existsSync(pastaWeb)) {
  app.use(express.static(pastaWeb));
  app.get('*', (_req, res) => res.sendFile(join(pastaWeb, 'index.html')));
}

app.listen(PORTA, () => console.log(`Yōkira API rodando em http://localhost:${PORTA}`));
